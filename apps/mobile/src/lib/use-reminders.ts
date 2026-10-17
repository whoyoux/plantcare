import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';

import { usePlants } from '@/lib/plants';
import { remindersAllowed, syncReminders } from '@/lib/reminders';

/** Whether notifications are allowed; re-checked when the screen regains focus (back from Settings). */
export function useRemindersAllowed() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useFocusEffect(
    useCallback(() => {
      void remindersAllowed().then(setAllowed);
    }, []),
  );
  return allowed;
}

/** Keeps the scheduled watering reminders in step with My plants and the app's language. */
export function useReminderSync() {
  const { t, i18n } = useTranslation();
  const { data: plants } = usePlants();

  useEffect(() => {
    if (!plants) return;
    void syncReminders(plants, t);
    // Days roll over while the app sleeps; rebuild when it comes back.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncReminders(plants, t);
    });
    return () => subscription.remove();
  }, [plants, t, i18n.language]);
}
