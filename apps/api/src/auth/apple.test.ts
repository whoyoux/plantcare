import { decodeJwt, decodeProtectedHeader, exportPKCS8, generateKeyPair, SignJWT } from 'jose';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { audienceOf, exchangeAuthorizationCode, revokeRefreshToken, type AppleKey } from './apple';

let key: AppleKey;

beforeAll(async () => {
  const { privateKey } = await generateKeyPair('ES256', { extractable: true });
  // Stored like in `.env`: one line with literal "\n" sequences.
  key = { teamId: 'TEAM123', keyId: 'KEY123', privateKey: (await exportPKCS8(privateKey)).replace(/\n/g, '\\n') };
});

afterEach(() => vi.unstubAllGlobals());

function mockFetch(response: Response) {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

function sentForm(fetch: ReturnType<typeof mockFetch>) {
  const [url, init] = fetch.mock.calls[0]!;
  return { url, form: new URLSearchParams(init?.body as URLSearchParams) };
}

describe('exchangeAuthorizationCode', () => {
  it('posts the code with a signed client secret and returns the refresh token', async () => {
    const fetch = mockFetch(Response.json({ refresh_token: 'refresh-1' }));

    await expect(exchangeAuthorizationCode(key, 'dev.whxx.plantcare', 'code-1')).resolves.toBe('refresh-1');

    const { url, form } = sentForm(fetch);
    expect(url).toBe('https://appleid.apple.com/auth/token');
    expect(form.get('grant_type')).toBe('authorization_code');
    expect(form.get('code')).toBe('code-1');
    expect(form.get('client_id')).toBe('dev.whxx.plantcare');

    const secret = form.get('client_secret')!;
    expect(decodeProtectedHeader(secret)).toMatchObject({ alg: 'ES256', kid: 'KEY123' });
    expect(decodeJwt(secret)).toMatchObject({
      iss: 'TEAM123',
      sub: 'dev.whxx.plantcare',
      aud: 'https://appleid.apple.com',
    });
  });

  it('fails when Apple rejects the code', async () => {
    mockFetch(new Response('invalid_grant', { status: 400 }));
    await expect(exchangeAuthorizationCode(key, 'dev.whxx.plantcare', 'bad')).rejects.toThrow('(400)');
  });

  it('fails when Apple returns no refresh token', async () => {
    mockFetch(Response.json({ access_token: 'only-access' }));
    await expect(exchangeAuthorizationCode(key, 'dev.whxx.plantcare', 'code')).rejects.toThrow('no refresh token');
  });
});

describe('revokeRefreshToken', () => {
  it('revokes the refresh token for the given client', async () => {
    const fetch = mockFetch(new Response(null, { status: 200 }));

    await revokeRefreshToken(key, 'dev.whxx.plantcare.preview', 'refresh-1');

    const { url, form } = sentForm(fetch);
    expect(url).toBe('https://appleid.apple.com/auth/revoke');
    expect(form.get('token')).toBe('refresh-1');
    expect(form.get('token_type_hint')).toBe('refresh_token');
    expect(form.get('client_id')).toBe('dev.whxx.plantcare.preview');
  });

  it('fails when Apple refuses', async () => {
    mockFetch(new Response(null, { status: 400 }));
    await expect(revokeRefreshToken(key, 'dev.whxx.plantcare', 'refresh-1')).rejects.toThrow('(400)');
  });
});

describe('audienceOf', () => {
  async function idToken(audience: string | string[]) {
    const { privateKey } = await generateKeyPair('ES256');
    return new SignJWT({}).setProtectedHeader({ alg: 'ES256' }).setAudience(audience).sign(privateKey);
  }

  it('reads the bundle ID from the token audience', async () => {
    expect(audienceOf(await idToken('dev.whxx.plantcare.dev'))).toBe('dev.whxx.plantcare.dev');
    expect(audienceOf(await idToken(['dev.whxx.plantcare', 'other']))).toBe('dev.whxx.plantcare');
  });

  it('returns undefined without a token', () => {
    expect(audienceOf(null)).toBeUndefined();
    expect(audienceOf(undefined)).toBeUndefined();
  });
});
