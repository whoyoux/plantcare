import * as Notifications from 'expo-notifications';
import type { TFunction } from 'i18next';

import type { Plant } from '@/lib/plants';

/** Reminders arrive once a day at this local hour, listing every plant due that day. */
const REMINDER_HOUR = 9;
/** How far ahead to schedule; the schedule is rebuilt whenever plants change or the app opens. */
const DAYS_AHEAD = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

// Show reminders as banners even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function remindersAllowed() {
  return (await Notifications.getPermissionsAsync()).granted;
}

/** Asks once (iOS shows the prompt only the first time); returns whether reminders may be shown. */
export async function requestReminders() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !current.canAskAgain) return current.granted;
  return (await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true } })).granted;
}

/**
 * Replaces all scheduled reminders with one per day for the next two weeks, for the plants whose
 * reminders the user turned on. A plant is listed on every day from its due date until it is
 * marked as watered, so an overdue plant keeps reminding.
 */
export async function syncReminders(allPlants: Plant[], t: TFunction, now = new Date()) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const plants = allPlants.filter((plant) => plant.remindersEnabled);
  if (plants.length === 0 || !(await remindersAllowed())) return;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let day = 0; day < DAYS_AHEAD; day++) {
    const at = new Date(today.getTime() + day * DAY_MS + REMINDER_HOUR * 60 * 60 * 1000);
    if (at <= now) continue;
    const endOfDay = today.getTime() + (day + 1) * DAY_MS;
    const due = plants.filter((plant) => new Date(plant.nextWateringAt).getTime() < endOfDay);
    if (due.length === 0) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: t('reminders.title'),
        body: due.map((plant) => plant.name).join(', '),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
    });
  }
}
