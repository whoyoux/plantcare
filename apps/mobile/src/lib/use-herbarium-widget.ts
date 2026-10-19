import * as Linking from 'expo-linking';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { widgetsDirectory } from 'expo-widgets';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { badgeName } from '@/lib/badges';
import { useHerbarium, type Species } from '@/lib/herbarium';
import HerbariumWidget from '@/widgets/herbarium';

const RECENT = 3;
/** Thumbnail edge in pixels: 44 pt at 3×. */
const THUMBNAIL = 132;
const PREFIX = 'herbarium-';

/**
 * A small square copy of the species photo in the directory the app shares with its widgets
 * (widgets can't read the app's files or download anything). Reuses the file if it exists.
 */
async function thumbnail(species: Species, directory: Directory) {
  const target = new File(directory, `${PREFIX}${species.bestId}.jpg`);
  if (target.exists) return target.uri;

  const source = await File.downloadFileAsync(
    species.imageUrl,
    new File(Paths.cache, `${PREFIX}source-${species.bestId}.jpg`),
    {
      idempotent: true,
    },
  );
  const original = await ImageManipulator.manipulate(source.uri).renderAsync();
  const side = Math.min(original.width, original.height);
  const image = await ImageManipulator.manipulate(source.uri)
    .crop({ originX: (original.width - side) / 2, originY: (original.height - side) / 2, width: side, height: side })
    .resize({ width: THUMBNAIL, height: THUMBNAIL })
    .renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  await new File(saved.uri).move(target);
  source.delete();
  return target.uri;
}

/** Keeps the Herbarium widget in step with the collection; it changes only after new finds. */
export function useHerbariumWidgetSync() {
  const { t, i18n } = useTranslation();
  const { data } = useHerbarium();

  useEffect(() => {
    if (Platform.OS !== 'ios' || !data || !widgetsDirectory) return;
    let cancelled = false;

    void (async () => {
      const directory = new Directory(widgetsDirectory);
      const recent = data.species.slice(0, RECENT);
      const images = await Promise.all(recent.map((species) => thumbnail(species, directory).catch(() => null)));
      if (cancelled) return;

      // Drop thumbnails of species that left the latest three.
      const keep = new Set(recent.map((species) => `${PREFIX}${species.bestId}.jpg`));
      for (const entry of directory.list()) {
        if (entry instanceof File && entry.name.startsWith(PREFIX) && !keep.has(entry.name)) entry.delete();
      }

      HerbariumWidget.updateSnapshot({
        title: t('herbarium.title'),
        speciesCount: data.speciesCount,
        familiesText: t('herbarium.families', { count: data.familyCount }),
        // No nulls in widget props (see HerbariumWidgetProps).
        next: data.next
          ? { name: badgeName(data.next, t, true), current: data.next.current, target: data.next.target }
          : { name: '', current: 0, target: 0 },
        doneText: data.speciesCount === 0 ? t('herbarium.cardEmpty') : t('herbarium.allBadges'),
        recent: recent.map((species, index) => ({
          name: species.commonName ?? species.scientificName,
          image: images[index] ?? '',
        })),
        // `at` makes the link open the herbarium even if the History tab was left on History.
        url: Linking.createURL('/history', { queryParams: { view: 'herbarium', at: String(Date.now()) } }),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [data, t, i18n.language]);
}
