import * as ImagePicker from 'expo-image-picker';

export type PhotoSource = 'camera' | 'library';

const options: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.8,
};

/** Returns the picked photo's local URI, or null if the user cancelled or denied access. */
export async function pickPhoto(source: PhotoSource): Promise<string | null> {
  if (source === 'camera') {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return null;
  }

  const result =
    source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);

  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}
