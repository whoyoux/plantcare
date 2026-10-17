import { File, Paths } from 'expo-file-system';
import type { TFunction } from 'i18next';
import { Share } from 'react-native';

import type { Identification } from '@plantcare/shared';

const SITE_URL = 'https://plantcare.whxx.dev';

/** A local copy of the photo for the share sheet (signed links expire, so share the file itself). */
async function localPhoto(id: string, photoUri: string) {
  if (!photoUri.startsWith('http')) return photoUri;
  const file = new File(Paths.cache, `plantcare-${id}.jpg`);
  if (!file.exists) await File.downloadFileAsync(photoUri, file);
  return file.uri;
}

/** Opens the system share sheet with the photo, the plant's names and its care tips. */
export async function shareIdentification(
  { id, photoUri, result }: { id: string; photoUri: string; result: Identification },
  t: TFunction,
) {
  const name = result.commonName ?? result.scientificName ?? '';
  const lines = [
    result.commonName && result.scientificName ? `${name} (${result.scientificName})` : name,
    ...(result.care
      ? [
          `${t('result.watering')}: ${result.care.watering}`,
          `${t('result.light')}: ${result.care.light}`,
          `${t('result.temperature')}: ${result.care.temperature}`,
        ]
      : []),
    '',
    `${t('share.footer')} ${SITE_URL}`,
  ];

  // The photo is a nice extra; if it can't be fetched, share the text alone.
  const url = await localPhoto(id, photoUri).catch(() => undefined);
  await Share.share({ message: lines.join('\n'), url });
}
