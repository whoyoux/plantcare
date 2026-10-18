import { createDb, schema } from '@plantcare/db';
import type { Identification } from '@plantcare/shared';
import { env, SELF } from 'cloudflare:test';
import { vi } from 'vitest';

export const db = createDb(env.HYPERDRIVE.connectionString);

/** Better Auth's signed cookie value: `token.base64(HMAC-SHA256(token))`, URL-encoded. */
async function signedCookie(token: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.BETTER_AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(token));
  return encodeURIComponent(`${token}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`);
}

/** A user with a live session, and a `request` helper that sends that session's cookie. */
export async function signedInUser(name = 'Test User') {
  const id = crypto.randomUUID();
  const token = crypto.randomUUID().replaceAll('-', '');
  await db.insert(schema.user).values({ id, name, email: `${id}@example.com`, emailVerified: true });
  await db.insert(schema.session).values({
    id: crypto.randomUUID(),
    userId: id,
    token,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  const cookie = `better-auth.session_token=${await signedCookie(token)}`;

  return {
    id,
    request(path: string, init: RequestInit = {}) {
      const headers = new Headers(init.headers);
      headers.set('Cookie', cookie);
      return SELF.fetch(`http://api.test${path}`, { ...init, headers });
    },
  };
}

export const monstera: Identification = {
  analysis: 'Large glossy heart-shaped leaves with deep splits and holes.',
  isPlant: true,
  scientificName: 'Monstera deliciosa',
  commonName: 'Monstera dziurawa',
  family: 'Araceae',
  confidence: 0.94,
  alternatives: [{ scientificName: 'Thaumatophyllum bipinnatifidum', commonName: null, confidence: 0.03 }],
  care: { watering: 'Co 7–10 dni', light: 'Jasne, rozproszone', temperature: '18–27 °C', wateringDays: 8 },
  toxicity: { cats: 'mild', dogs: 'mild', people: 'mild', note: 'Sok z liści podrażnia usta i żołądek.' },
};

/** The URL of a fetch call, whatever form the input took. */
export function urlOf(input: RequestInfo | URL) {
  return input instanceof Request ? input.url : input instanceof URL ? input.href : input;
}

/** Calls to the model (OpenRouter) made by a mocked fetch. */
export function modelCalls(fetch: ReturnType<typeof mockModel>) {
  return fetch.mock.calls.filter(([input]) => urlOf(input).startsWith('https://openrouter.ai/'));
}

/** Answers model requests to OpenRouter with `result`; every other request goes out as usual. */
export function mockModel(result: Identification) {
  const realFetch = globalThis.fetch;
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    if (urlOf(input).startsWith('https://openrouter.ai/')) {
      return Promise.resolve(Response.json({ choices: [{ message: { content: JSON.stringify(result) } }] }));
    }
    return realFetch(input, init);
  });
}

/** A tiny but valid-looking JPEG body (the API checks the magic bytes, the model is mocked). */
export function jpeg() {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])], 'photo.jpg', { type: 'image/jpeg' });
}

export function identifyForm(photo: File | File[] = jpeg(), language = 'pl') {
  const form = new FormData();
  for (const file of Array.isArray(photo) ? photo : [photo]) form.append('photo', file);
  form.append('language', language);
  return form;
}
