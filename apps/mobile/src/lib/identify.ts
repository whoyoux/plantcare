import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
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

/** Uploads a photo to POST /v1/identify (multipart, so it goes through fetch rather than the hc helper). */
export async function identifyPhoto(uri: string, language: Language): Promise<IdentifyResponse> {
  const photo = await preparePhoto(uri);
  const form = new FormData();
  // React Native's FormData takes a file reference instead of a Blob.
  form.append('photo', { uri: photo.uri, type: 'image/jpeg', name: 'photo.jpg' } as unknown as Blob);
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
