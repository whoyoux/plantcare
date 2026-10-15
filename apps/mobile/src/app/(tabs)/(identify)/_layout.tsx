import { Stack } from 'expo-router';

import { largeTitleScreenOptions } from '@/lib/navigation';

export default function IdentifyLayout() {
  return (
    <Stack screenOptions={largeTitleScreenOptions}>
      {/* Home screen carries the app name; the tab itself stays "Identify". */}
      <Stack.Screen name="index" options={{ title: 'PlantCare' }} />
    </Stack>
  );
}
