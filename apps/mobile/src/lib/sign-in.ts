import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import { api, ensureOk } from '@/lib/api';
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

  const { error } = await authClient.signIn.social({
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
 * Deletes the account. Accounts linked to Apple re-authenticate first: the server needs a fresh
 * authorization code to revoke the app's Apple token, as App Review requires.
 * Returns false when the user cancels.
 */
export async function deleteAccount(): Promise<boolean> {
  const { data: accounts } = await authClient.listAccounts();
  const usesApple = accounts?.some((account) => account.providerId === 'apple') ?? false;

  let authorizationCode: string | undefined;
  if (usesApple) {
    try {
      const credential = await AppleAuthentication.signInAsync({ requestedScopes: [] });
      authorizationCode = credential.authorizationCode ?? undefined;
    } catch (error) {
      if (isAppleCancel(error)) return false;
      throw error;
    }
    if (!authorizationCode) throw new Error('Apple returned no authorization code');
  }

  await ensureOk(await api.v1.account.delete.$post({ json: { authorizationCode, bundleId: env.bundleId } }));

  await signOut();
  return true;
}
