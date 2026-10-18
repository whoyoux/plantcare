import * as ImagePicker from 'expo-image-picker';

/** Photos per identification (the API takes up to three of one plant). */
export const MAX_PHOTOS = 3;

/** Picks up to `limit` photos from the library; an empty list if the user cancelled. */
export async function pickPhotos(limit = MAX_PHOTOS): Promise<string[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    orderedSelection: true,
  });
  return result.canceled ? [] : result.assets.map((asset) => asset.uri);
}
