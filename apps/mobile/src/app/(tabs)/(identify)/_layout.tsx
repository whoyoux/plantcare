import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { largeTitleScreenOptions } from '@/lib/navigation';

export default function IdentifyLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={largeTitleScreenOptions}>
      <Stack.Screen name="index" options={{ title: t('identify.title') }} />
    </Stack>
  );
}
