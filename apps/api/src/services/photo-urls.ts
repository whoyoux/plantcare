const DAY_MS = 24 * 60 * 60 * 1000;

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
}

/** Constant-time comparison, so a signature can't be guessed byte by byte from response timing. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Short-lived signed links to photos in the private R2 bucket, served by the API. Links expire at
 * the end of the next UTC day, so a URL stays the same for a while and the app's image cache works.
 */
export function createPhotoUrls(deps: { apiUrl: string; secret: string }) {
  return {
    async sign(key: string, now = Date.now()) {
      const expires = Math.ceil(now / DAY_MS) * DAY_MS + DAY_MS;
      const signature = await hmac(deps.secret, `${key}:${expires}`);
      const params = new URLSearchParams({ expires: String(expires), signature });
      return `${deps.apiUrl}/v1/photos/${key}?${params.toString()}`;
    },

    async verify(key: string, expires: string | undefined, signature: string | undefined, now = Date.now()) {
      if (!expires || !signature || !/^\d+$/.test(expires) || Number(expires) < now) return false;
      return safeEqual(await hmac(deps.secret, `${key}:${expires}`), signature);
    },
  };
}

export type PhotoUrls = ReturnType<typeof createPhotoUrls>;
