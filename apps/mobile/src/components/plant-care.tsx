import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Image } from '@/components/image';
import { daysUntilWatering, useDeletePlant, usePlants, useUpdatePlant, useWaterPlant, type Plant } from '@/lib/plants';
import { requestReminders } from '@/lib/reminders';

function useAccent() {
  const accent = useCSSVariable('--color-accent');
  return typeof accent === 'string' ? accent : undefined;
}

/** "Water today", "Tomorrow", "In 3 days" or "2 days late". */
export function useDueLabel() {
  const { t } = useTranslation();
  return (plant: Plant) => {
    const days = daysUntilWatering(plant);
    if (days < 0) return { text: t('plants.overdue', { count: -days }), late: true };
    if (days === 0) return { text: t('plants.dueToday'), late: false };
    if (days === 1) return { text: t('plants.dueTomorrow'), late: false };
    return { text: t('plants.dueIn', { count: days }), late: false };
  };
}

/** Watering, interval, rename and remove, with the prompts and confirmations they need. */
export function usePlantActions() {
  const { t } = useTranslation();
  const water = useWaterPlant();
  const update = useUpdatePlant();
  const remove = useDeletePlant();
  const failed = () => Alert.alert(t('plants.failed'));

  return {
    /** Turning reminders on asks for notification permission the first time; off never asks. */
    async toggleReminders(plant: Plant) {
      if (plant.remindersEnabled) {
        update.mutate({ id: plant.id, remindersEnabled: false }, { onError: failed });
        return;
      }
      if (!(await requestReminders())) {
        Alert.alert(t('plants.remindersTitle'), t('plants.remindersOff'), [
          { text: t('plants.cancel'), style: 'cancel' },
          { text: t('plants.openSettings'), onPress: () => void Linking.openSettings() },
        ]);
        return;
      }
      void Haptics.selectionAsync();
      update.mutate({ id: plant.id, remindersEnabled: true }, { onError: failed });
    },
    water(plant: Plant) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      water.mutate(plant.id, { onError: failed });
    },
    changeInterval(plant: Plant) {
      Alert.prompt(
        t('plants.changeInterval'),
        t('plants.intervalPrompt'),
        [
          { text: t('plants.cancel'), style: 'cancel' },
          {
            text: t('plants.save'),
            onPress: (value?: string) => {
              const days = Number(value);
              if (!Number.isInteger(days) || days < 1 || days > 60) return;
              update.mutate({ id: plant.id, wateringIntervalDays: days }, { onError: failed });
            },
          },
        ],
        'plain-text',
        String(plant.wateringIntervalDays),
        'number-pad',
      );
    },
    rename(plant: Plant) {
      Alert.prompt(
        t('plants.rename'),
        undefined,
        [
          { text: t('plants.cancel'), style: 'cancel' },
          {
            text: t('plants.save'),
            onPress: (value?: string) => {
              const name = value?.trim();
              if (name) update.mutate({ id: plant.id, name }, { onError: failed });
            },
          },
        ],
        'plain-text',
        plant.name,
      );
    },
    remove(plant: Plant) {
      Alert.alert(t('plants.removeTitle'), t('plants.removeMessage'), [
        { text: t('plants.cancel'), style: 'cancel' },
        {
          text: t('plants.remove'),
          style: 'destructive',
          onPress: () => remove.mutate(plant.id, { onError: failed }),
        },
      ]);
    },
  };
}

export function openPlant(plant: Plant) {
  if (plant.identificationId) router.push({ pathname: '/result', params: { id: plant.identificationId } });
}

/** Photo, name, interval and when it next needs water, with a one-tap "watered" button. */
export function PlantCareRow({ plant, onLongPress }: { plant: Plant; onLongPress?: () => void }) {
  const { t } = useTranslation();
  const accent = useAccent();
  const due = useDueLabel()(plant);
  const actions = usePlantActions();
  const needsWater = daysUntilWatering(plant) <= 0;
  const muted = useCSSVariable('--color-muted');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openPlant(plant)}
      onLongPress={onLongPress}
      className="flex-row items-center gap-3 rounded-2xl bg-card p-2.5 active:opacity-80"
    >
      <Image
        source={{ uri: plant.imageUrl, cacheKey: `plant-${plant.id}` }}
        contentFit="cover"
        transition={150}
        className="size-14 rounded-xl bg-accent-soft"
      />
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="text-[17px] font-semibold text-foreground">
          {plant.name}
        </Text>
        <Text numberOfLines={1} className={`text-[14px] ${due.late ? 'text-danger' : 'text-muted'}`}>
          {due.text} · {t('plants.every', { count: plant.wateringIntervalDays })}
        </Text>
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: plant.remindersEnabled }}
        accessibilityLabel={t('plants.reminders')}
        onPress={() => void actions.toggleReminders(plant)}
        hitSlop={8}
        className="size-11 items-center justify-center rounded-full active:opacity-70"
      >
        <SymbolView
          name={plant.remindersEnabled ? 'bell.fill' : 'bell.slash'}
          size={19}
          tintColor={plant.remindersEnabled ? accent : typeof muted === 'string' ? muted : undefined}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('plants.water')}
        onPress={() => actions.water(plant)}
        hitSlop={8}
        className={`size-11 items-center justify-center rounded-full ${needsWater ? 'bg-accent-fill' : 'bg-accent-soft'} active:opacity-70`}
      >
        <SymbolView name="drop.fill" size={20} tintColor={needsWater ? 'white' : accent} />
      </Pressable>
    </Pressable>
  );
}

/** Home screen: plants due today or overdue. Hidden until the user has plants. */
export function DueToday() {
  const { t } = useTranslation();
  const { data: plants } = usePlants();
  if (!plants?.length) return null;
  const due = plants.filter((plant) => daysUntilWatering(plant) <= 0);

  return (
    <View className="gap-2.5">
      <Text className="px-1 font-rounded text-[20px] font-bold text-foreground">{t('identify.dueTitle')}</Text>
      {due.length > 0 ? (
        due.map((plant) => <PlantCareRow key={plant.id} plant={plant} />)
      ) : (
        <View className="rounded-2xl bg-card px-4 py-4">
          <Text className="text-[15px] text-muted">{t('identify.allWatered')}</Text>
        </View>
      )}
    </View>
  );
}
