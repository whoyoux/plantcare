import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { largeTitleScreenOptions } from '@/lib/navigation';

export default function HistoryLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={largeTitleScreenOptions}>
      <Stack.Screen name="history" options={{ title: t('history.title') }} />
      <Stack.Screen name="species" options={{ title: '', headerLargeTitleEnabled: false }} />
      <Stack.Screen name="badges" options={{ title: t('herbarium.badges') }} />
    </Stack>
  );
}
