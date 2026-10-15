import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { largeTitleScreenOptions } from '@/lib/navigation';

export default function SettingsLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={largeTitleScreenOptions}>
      {/* On iOS the SwiftUI form renders its own navigation bar (see components/native/form.ios.tsx). */}
      <Stack.Screen name="settings" options={{ title: t('settings.title'), headerShown: Platform.OS !== 'ios' }} />
    </Stack>
  );
}
