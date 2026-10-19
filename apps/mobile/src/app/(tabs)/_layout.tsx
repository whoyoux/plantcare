import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { useQuickActions } from '@/lib/quick-actions';
import { useReminderSync } from '@/lib/use-reminders';
import { useHerbariumWidgetSync } from '@/lib/use-herbarium-widget';
import { useWidgetSync } from '@/lib/use-widget';

export default function TabsLayout() {
  const { t } = useTranslation();
  const accent = useCSSVariable('--color-accent');
  useReminderSync();
  useQuickActions();
  useWidgetSync();
  useHerbariumWidgetSync();

  return (
    <NativeTabs tintColor={typeof accent === 'string' ? accent : undefined} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="(identify)">
        <NativeTabs.Trigger.Icon sf={{ default: 'camera.macro', selected: 'camera.macro' }} md="photo_camera" />
        <NativeTabs.Trigger.Label>{t('tabs.identify')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(plants)">
        <NativeTabs.Trigger.Icon sf={{ default: 'drop', selected: 'drop.fill' }} md="water_drop" />
        <NativeTabs.Trigger.Label>{t('tabs.plants')}</NativeTabs.Trigger.Label>
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
