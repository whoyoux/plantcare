import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { router } from 'expo-router';
import type { InferResponseType } from 'hono/client';
import { fetch as nitroFetch } from 'react-native-nitro-fetch';

import type { Language } from '@/i18n';
import { api, ensureOk } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

export type IdentifyResponse = InferResponseType<typeof api.v1.identify.$post, 201>;

/** Longest edge sent to the API: enough detail for the model, small enough to upload quickly. */
const MAX_EDGE = 1024;

/**
 * Downsizes the photo and re-encodes it as JPEG. Re-encoding writes a fresh file without the
 * original metadata (EXIF, including location), as promised in the privacy policy.
 */
async function preparePhoto(uri: string) {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const scale = Math.min(1, MAX_EDGE / Math.max(original.width, original.height));
  const context = ImageManipulator.manipulate(uri);
  if (scale < 1) context.resize({ width: Math.round(original.width * scale) });
  const image = await context.renderAsync();
  return image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
}

/** Opens the result sheet for new photos of one plant; `replace` swaps out the camera. */
export function openNewResult(uris: string[], mode: 'push' | 'replace' = 'push') {
  const href = { pathname: '/result', params: { photos: JSON.stringify(uris) } } as const;
  if (mode === 'replace') router.replace(href);
  else router.push(href);
}

/**
 * Uploads photos of one plant to POST /v1/identify (multipart, so it goes through fetch rather
 * than the hc helper). The first photo is the one kept in history.
 */
export async function identifyPhotos(uris: string[], language: Language): Promise<IdentifyResponse> {
  const photos = await Promise.all(uris.map(preparePhoto));
  const form = new FormData();
  photos.forEach((photo, index) => {
    // React Native's FormData takes a file reference instead of a Blob.
    form.append('photo', { uri: photo.uri, type: 'image/jpeg', name: `photo-${index}.jpg` } as unknown as Blob);
  });
  form.append('language', language);

  const cookie = await authClient.getCookie();
  const response = await nitroFetch(api.v1.identify.$url().toString(), {
    method: 'POST',
    body: form,
    headers: cookie ? { Cookie: cookie } : {},
    credentials: 'omit',
  });
  await ensureOk(response);
  return (await response.json()) as IdentifyResponse;
}
