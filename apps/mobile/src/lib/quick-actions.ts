import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting, type RouterAction } from 'expo-quick-actions/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * "Identify a plant" on the app icon's long-press menu: opens straight into the camera. Set from
 * JS so the title follows the app language; it appears after the first signed-in launch. Call
 * from a layout below the root (the routing navigates on mount).
 */
export function useQuickActions() {
  const { t, i18n } = useTranslation();
  useQuickActionRouting();

  useEffect(() => {
    void QuickActions.setItems<RouterAction>([
      {
        id: 'identify',
        title: t('identify.quickAction'),
        icon: 'symbol:camera.macro',
        params: { href: '/camera' },
      },
    ]);
  }, [t, i18n.language]);
}
