import { Image as ExpoImage } from 'expo-image';
import { withUniwind } from 'uniwind';

/** expo-image with `className` support (Uniwind only styles RN core components out of the box). */
export const Image = withUniwind(ExpoImage);
