import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Platform } from 'react-native';
import type { TFunction } from 'i18next';

import { daysUntilWatering, usePlants, type Plant } from '@/lib/plants';
import WateringWidget, { type WateringWidgetProps } from '@/widgets/watering';

/** How many days ahead the widget's timeline reaches, in case the app isn't opened for a while. */
const DAYS_AHEAD = 7;

function startOfDay(date: Date, offsetDays: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offsetDays);
}

/** What the widget shows on `day`: the plants due then (late first), labelled for that day. */
export function widgetProps(plants: Plant[], day: Date, t: TFunction, url: string): WateringWidgetProps {
  const due = plants
    .map((plant) => ({ plant, days: daysUntilWatering(plant, day) }))
    .filter(({ days }) => days <= 0)
    .sort((a, b) => a.days - b.days);
  return {
    count: due.length,
    title: t('identify.dueTitle'),
    emptyText: plants.length === 0 ? t('widget.noPlants') : t('identify.allWatered'),
    plants: due.slice(0, 3).map(({ plant, days }) => ({
      name: plant.name,
      label: days < 0 ? t('plants.overdue', { count: -days }) : t('plants.dueToday'),
      late: days < 0,
    })),
    url,
  };
}

/**
 * Keeps the "Water today" home screen widget in step with My plants: one timeline entry for now and
 * one for each of the next midnights, so the widget stays right for a week without the app.
 */
export function useWidgetSync() {
  const { t, i18n } = useTranslation();
  const { data: plants } = usePlants();

  useEffect(() => {
    if (Platform.OS !== 'ios' || !plants) return;
    const url = Linking.createURL('/plants');
    const update = () => {
      const now = new Date();
      WateringWidget.updateTimeline(
        Array.from({ length: DAYS_AHEAD + 1 }, (_, offset) => {
          const date = offset === 0 ? now : startOfDay(now, offset);
          return { date, props: widgetProps(plants, date, t, url) };
        }),
      );
    };
    update();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') update();
    });
    return () => subscription.remove();
  }, [plants, t, i18n.language]);
}
