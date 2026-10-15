import type { AppType } from '@plantcare/api/client';
import { hc } from 'hono/client';
import { fetch as nitroFetch } from 'react-native-nitro-fetch';

import { authClient } from '@/lib/auth-client';
import { env } from '@/lib/env';

/**
 * Typed client for our Hono API. Requests go through react-native-nitro-fetch (native URLSession /
 * Cronet, HTTP/2–3) and carry the Better Auth session cookie.
 */
export const api = hc<AppType>(env.apiUrl, {
  fetch: nitroFetch,
  headers: async (): Promise<Record<string, string>> => {
    const cookie = await authClient.getCookie();
    return cookie ? { Cookie: cookie } : {};
  },
  init: { credentials: 'omit' },
});

/** Error with the API's machine-readable `code` (translated in the app, never shown raw). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
  ) {
    super(code ?? `HTTP ${status}`);
  }
}

/** Throws ApiError for non-2xx responses; use inside TanStack Query functions. */
export async function ensureOk<T extends { ok: boolean; status: number; json(): Promise<unknown> }>(
  response: T,
): Promise<T> {
  if (response.ok) return response;
  const body = (await response.json().catch(() => null)) as { code?: string } | null;
  throw new ApiError(response.status, body?.code);
}
