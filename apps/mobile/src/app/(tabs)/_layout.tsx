import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

export default function TabsLayout() {
  const { t } = useTranslation();
  const accent = useCSSVariable('--color-accent');

  return (
    <NativeTabs tintColor={typeof accent === 'string' ? accent : undefined} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="(identify)">
        <NativeTabs.Trigger.Icon sf={{ default: 'camera.macro', selected: 'camera.macro' }} md="photo_camera" />
        <NativeTabs.Trigger.Label>{t('tabs.identify')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(history)">
        <NativeTabs.Trigger.Icon sf={{ default: 'leaf', selected: 'leaf.fill' }} md="history" />
        <NativeTabs.Trigger.Label>{t('tabs.history')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
        <NativeTabs.Trigger.Label>{t('tabs.settings')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
