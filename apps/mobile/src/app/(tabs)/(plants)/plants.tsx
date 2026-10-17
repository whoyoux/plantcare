import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionSheetIOS, ActivityIndicator, FlatList, Linking, Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/native/empty-state';
import { PlantCareRow, usePlantActions } from '@/components/plant-care';
import { usePlants, type Plant } from '@/lib/plants';
import { useRemindersAllowed } from '@/lib/use-reminders';

export default function PlantsScreen() {
  const { t } = useTranslation();
  const plants = usePlants();
  const actions = usePlantActions();
  const remindersAllowed = useRemindersAllowed();
  const [pulling, setPulling] = useState(false);

  async function refresh() {
    setPulling(true);
    await plants.refetch();
    setPulling(false);
  }

  function showActions(plant: Plant) {
    const options = [
      t('plants.water'),
      plant.remindersEnabled ? t('plants.remindersDisable') : t('plants.remindersEnable'),
      t('plants.changeInterval'),
      t('plants.rename'),
      t('plants.remove'),
      t('plants.cancel'),
    ];
    ActionSheetIOS.showActionSheetWithOptions(
      { title: plant.name, options, destructiveButtonIndex: 4, cancelButtonIndex: 5 },
      (index) => {
        if (index === 0) actions.water(plant);
        if (index === 1) void actions.toggleReminders(plant);
        if (index === 2) actions.changeInterval(plant);
        if (index === 3) actions.rename(plant);
        if (index === 4) actions.remove(plant);
      },
    );
  }

  return (
    <FlatList
      className="flex-1 bg-background"
      data={plants.data ?? []}
      keyExtractor={(plant) => plant.id}
      renderItem={({ item }) => <PlantCareRow plant={item} onLongPress={() => showActions(item)} />}
      contentInsetAdjustmentBehavior="automatic"
      // Fill the screen only for the empty state; otherwise a short list would still scroll.
      contentContainerClassName={`gap-2.5 px-4 pb-8 pt-2 ${plants.data?.length ? '' : 'grow'}`}
      refreshing={pulling}
      onRefresh={() => void refresh()}
      ListHeaderComponent={
        remindersAllowed === false && plants.data?.some((plant) => plant.remindersEnabled) ? (
          <Pressable onPress={() => void Linking.openSettings()} className="mb-1 rounded-2xl bg-accent-soft px-4 py-3">
            <Text className="text-[14px] leading-5 text-accent">{t('plants.remindersOff')}</Text>
          </Pressable>
        ) : undefined
      }
      ListEmptyComponent={
        plants.isPending ? (
          <ActivityIndicator className="py-10" />
        ) : (
          <View className="flex-1">
            <EmptyState title={t('plants.emptyTitle')} description={t('plants.emptyDescription')} systemImage="drop" />
          </View>
        )
      }
    />
  );
}
