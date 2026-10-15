import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

import { env } from '@/lib/env';

export const authClient = createAuthClient({
  baseURL: env.apiUrl,
  plugins: [
    expoClient({
      scheme: env.scheme,
      // Separate keychain entries per variant (Dev and Preview share a backend but not a session).
      storagePrefix: env.scheme,
      storage: SecureStore,
    }),
  ],
});

/** fetch to our own API with the Better Auth session cookie attached. */
export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const cookie = await authClient.getCookie();
  if (cookie) headers.set('Cookie', cookie);
  return fetch(new URL(path, env.apiUrl), { ...init, headers, credentials: 'omit' });
}
