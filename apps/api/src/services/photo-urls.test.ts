import { describe, expect, it } from 'vitest';

import { createPhotoUrls } from './photo-urls';

const urls = createPhotoUrls({ apiUrl: 'https://api.example', secret: 'secret' });
const key = 'users/u1/p1.jpg';
const now = Date.UTC(2026, 9, 17, 15, 0);

async function signed() {
  const url = new URL(await urls.sign(key, now));
  return { url, expires: url.searchParams.get('expires')!, signature: url.searchParams.get('signature')! };
}

describe('photo URLs', () => {
  it('points at the photo route and expires at the end of the next UTC day', async () => {
    const { url, expires } = await signed();
    expect(url.pathname).toBe('/v1/photos/users/u1/p1.jpg');
    expect(Number(expires)).toBe(Date.UTC(2026, 9, 19));
  });

  it('is stable within a day, so cached images are reused', async () => {
    expect(await urls.sign(key, now)).toBe(await urls.sign(key, now + 60 * 60 * 1000));
  });

  it('verifies its own signature', async () => {
    const { expires, signature } = await signed();
    await expect(urls.verify(key, expires, signature, now)).resolves.toBe(true);
  });

  it('rejects another key, a changed expiry, a bad signature and an expired link', async () => {
    const { expires, signature } = await signed();
    await expect(urls.verify('users/u2/p1.jpg', expires, signature, now)).resolves.toBe(false);
    await expect(urls.verify(key, String(Number(expires) + 1), signature, now)).resolves.toBe(false);
    await expect(urls.verify(key, expires, signature.replace(/.$/, '0'), now)).resolves.toBe(false);
    await expect(urls.verify(key, expires, signature, Number(expires) + 1)).resolves.toBe(false);
    await expect(urls.verify(key, undefined, signature, now)).resolves.toBe(false);
  });
});
