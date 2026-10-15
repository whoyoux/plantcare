import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { largeTitleScreenOptions } from '@/lib/navigation';

export default function SettingsLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={largeTitleScreenOptions}>
      <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
    </Stack>
  );
}
