import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import { authClient } from '@/lib/auth-client';
import { env } from '@/lib/env';

export type Provider = 'apple' | 'google';

/** Apple on iOS only; Google wherever its client IDs are configured for this build. */
export const availableProviders: Provider[] = [
  ...(Platform.OS === 'ios' ? (['apple'] as const) : []),
  ...(env.google.webClientId && (Platform.OS !== 'ios' || env.google.iosClientId) ? (['google'] as const) : []),
];

function isAppleCancel(error: unknown) {
  return error instanceof Error && 'code' in error && error.code === 'ERR_REQUEST_CANCELED';
}

/**
 * Native Sign in with Apple. Apple gets the SHA-256 of a random nonce; the server receives the raw
 * nonce and verifies it against the ID token. Returns false when the user cancels.
 */
async function signInWithApple(): Promise<boolean> {
  const nonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if (isAppleCancel(error)) return false;
    throw error;
  }
  if (!credential.identityToken) throw new Error('Apple returned no identity token');

  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
  const { data, error } = await authClient.signIn.social({
    provider: 'apple',
    idToken: {
      token: credential.identityToken,
      nonce,
      // Apple sends the name only on the first authorization and never inside the token.
      user: {
        name: {
          firstName: credential.fullName?.givenName ?? undefined,
          lastName: credential.fullName?.familyName ?? undefined,
        },
        email: credential.email ?? undefined,
      },
    },
  });
  if (error) throw new Error(error.message ?? 'Sign in failed');

  // Better Auth only uses the name when it creates the user. If the account already existed
  // without one (e.g. created before the name was shared), fill it in now: Apple won't send it again.
  if (fullName && data && 'user' in data && !data.user.name) {
    await authClient.updateUser({ name: fullName }).catch((updateError: unknown) => console.warn(updateError));
  }

  // Lets the server keep Apple's refresh token, so deleting the account can revoke it later.
  if (credential.authorizationCode) {
    await authClient
      .$fetch('/apple/authorization-code', {
        method: 'POST',
        body: { authorizationCode: credential.authorizationCode, bundleId: env.bundleId },
      })
      .catch((storeError: unknown) => console.warn('Storing the Apple authorization code failed', storeError));
  }
  return true;
}

let googleConfigured = false;

/** Native Google Sign-In. The ID token's audience is the web client the backend verifies. */
async function signInWithGoogle(): Promise<boolean> {
  if (!googleConfigured) {
    GoogleSignin.configure({
      webClientId: env.google.webClientId,
      iosClientId: env.google.iosClientId || undefined,
    });
    googleConfigured = true;
  }

  if (Platform.OS === 'android') await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn().catch((error: unknown) => {
    if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) return null;
    throw error;
  });
  if (!response || response.type === 'cancelled') return false;
  if (!response.data.idToken) throw new Error('Google returned no ID token');

  const { error } = await authClient.signIn.social({
    provider: 'google',
    idToken: { token: response.data.idToken },
  });
  if (error) throw new Error(error.message ?? 'Sign in failed');
  return true;
}

export function signIn(provider: Provider) {
  return provider === 'apple' ? signInWithApple() : signInWithGoogle();
}

export async function signOut() {
  await authClient.signOut();
  if (googleConfigured) await GoogleSignin.signOut().catch(() => undefined);
}

/**
 * Deletes the account through Better Auth. The server revokes the stored Apple token and deletes
 * photos and history before removing the user.
 */
export async function deleteAccount(): Promise<boolean> {
  const { error } = await authClient.deleteUser();
  if (error) throw new Error(error.message ?? 'Account deletion failed');
  await signOut().catch(() => undefined);
  return true;
}
