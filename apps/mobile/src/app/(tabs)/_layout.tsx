import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { useQuickActions } from '@/lib/quick-actions';
import { TabBarProvider } from '@/lib/tab-bar';
import { useReminderSync } from '@/lib/use-reminders';
import { useHerbariumWidgetSync } from '@/lib/use-herbarium-widget';
import { useWidgetSync } from '@/lib/use-widget';

/**
 * Three tabs in the floating Liquid Glass bar, plus the camera as the separate round button
 * (the `search` role puts a tab there on iOS 26). The camera tab hides the bar while it is open.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const accent = useCSSVariable('--color-accent');
  useReminderSync();
  useQuickActions();
  useWidgetSync();
  useHerbariumWidgetSync();

  return (
    <TabBarProvider>
      {(hidden) => (
        <NativeTabs
          tintColor={typeof accent === 'string' ? accent : undefined}
          minimizeBehavior="onScrollDown"
          hidden={hidden}
        >
          <NativeTabs.Trigger name="(identify)">
            <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
            <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="(plants)">
            <NativeTabs.Trigger.Icon sf={{ default: 'drop', selected: 'drop.fill' }} md="water_drop" />
            <NativeTabs.Trigger.Label>{t('tabs.plants')}</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="(history)">
            <NativeTabs.Trigger.Icon
              sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }}
              md="grid_view"
            />
            <NativeTabs.Trigger.Label>{t('tabs.herbarium')}</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="scan" role="search">
            <NativeTabs.Trigger.Icon sf={{ default: 'camera', selected: 'camera.fill' }} md="photo_camera" />
            <NativeTabs.Trigger.Label>{t('tabs.identify')}</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      )}
    </TabBarProvider>
  );
}
