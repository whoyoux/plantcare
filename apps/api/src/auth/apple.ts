import { decodeJwt, importPKCS8, SignJWT } from 'jose';

const APPLE = 'https://appleid.apple.com';

export type AppleKey = { teamId: string; keyId: string; privateKey: string };

/** Short-lived client secret JWT for Apple's token endpoints, signed with the Sign in with Apple key. */
async function clientSecret(key: AppleKey, clientId: string) {
  // `.env` values usually carry the PEM with literal "\n" sequences.
  const pem = key.privateKey.replace(/\\n/g, '\n');
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: key.keyId })
    .setIssuer(key.teamId)
    .setSubject(clientId)
    .setAudience(APPLE)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(await importPKCS8(pem, 'ES256'));
}

async function post(path: string, body: Record<string, string>) {
  return fetch(`${APPLE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
}

/** Exchanges the one-time authorization code from the app for Apple's long-lived refresh token. */
export async function exchangeAuthorizationCode(key: AppleKey, clientId: string, code: string) {
  const response = await post('/auth/token', {
    client_id: clientId,
    client_secret: await clientSecret(key, clientId),
    code,
    grant_type: 'authorization_code',
  });
  if (!response.ok) throw new Error(`Apple token exchange failed (${response.status})`);
  const { refresh_token: refreshToken } = await response.json<{ refresh_token?: string }>();
  if (!refreshToken) throw new Error('Apple returned no refresh token');
  return refreshToken;
}

/** Revokes a refresh token, which disconnects the app from the user's Apple ID. */
export async function revokeRefreshToken(key: AppleKey, clientId: string, refreshToken: string) {
  const response = await post('/auth/revoke', {
    client_id: clientId,
    client_secret: await clientSecret(key, clientId),
    token: refreshToken,
    token_type_hint: 'refresh_token',
  });
  if (!response.ok) throw new Error(`Apple token revocation failed (${response.status})`);
}

/** The app (bundle ID) an Apple ID token was issued to. */
export function audienceOf(idToken: string | null | undefined): string | undefined {
  if (!idToken) return undefined;
  const { aud } = decodeJwt(idToken);
  return Array.isArray(aud) ? aud[0] : aud;
}
