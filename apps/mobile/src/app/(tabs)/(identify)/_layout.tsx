import { Stack } from 'expo-router';

import { largeTitleScreenOptions } from '@/lib/navigation';

export default function IdentifyLayout() {
  return (
    <Stack screenOptions={largeTitleScreenOptions}>
      {/* Home draws its own top: the latest photo runs under the status bar. */}
      <Stack.Screen name="index" options={{ title: 'PlantCare', headerShown: false }} />
    </Stack>
  );
}
