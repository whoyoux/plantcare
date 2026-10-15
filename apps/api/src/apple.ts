import { importPKCS8, SignJWT } from 'jose';

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

/**
 * Exchanges a fresh authorization code for Apple tokens and revokes them, which unlinks the app from
 * the user's Apple ID. Required by App Review when an account created with Sign in with Apple is deleted.
 */
export async function revokeAppleAuthorization(key: AppleKey, clientId: string, authorizationCode: string) {
  const secret = await clientSecret(key, clientId);

  const tokenResponse = await fetch(`${APPLE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: secret,
      code: authorizationCode,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenResponse.ok) throw new Error(`Apple token exchange failed (${tokenResponse.status})`);
  const { refresh_token: refreshToken } = await tokenResponse.json<{ refresh_token?: string }>();
  if (!refreshToken) throw new Error('Apple returned no refresh token');

  const revokeResponse = await fetch(`${APPLE}/auth/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: secret,
      token: refreshToken,
      token_type_hint: 'refresh_token',
    }),
  });
  if (!revokeResponse.ok) throw new Error(`Apple token revocation failed (${revokeResponse.status})`);
}
