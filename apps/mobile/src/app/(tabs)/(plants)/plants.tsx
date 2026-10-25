import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionSheetIOS, ActivityIndicator, FlatList, Linking, Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/native/empty-state';
import { PlantCareRow, PlantPhotoCard, usePlantActions } from '@/components/plant-care';
import { daysUntilWatering, usePlants, type Plant } from '@/lib/plants';
import { useRemindersAllowed } from '@/lib/use-reminders';
import { haptics } from '@/lib/haptics';

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
    // A long press with no system menu of its own: confirm it like a context menu would.
    haptics.tap();
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

  if (plants.isSuccess && plants.data.length === 0) {
    // A static screen: an empty list stretched to the screen height would still scroll by the
    // large title and tab bar insets (and that minimizes the tab bar).
    return (
      <View className="flex-1 bg-background">
        <EmptyState title={t('plants.emptyTitle')} description={t('plants.emptyDescription')} systemImage="drop" />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-background"
      data={plants.data ?? []}
      keyExtractor={(plant) => plant.id}
      renderItem={({ item }) =>
        // Plants that need water now get the big photo card; the rest stay compact rows.
        daysUntilWatering(item) <= 0 ? (
          <PlantPhotoCard plant={item} onLongPress={() => showActions(item)} />
        ) : (
          <PlantCareRow plant={item} onLongPress={() => showActions(item)} />
        )
      }
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-2.5 px-4 pb-8 pt-2"
      refreshing={pulling}
      onRefresh={() => void refresh()}
      ListHeaderComponent={
        remindersAllowed === false && plants.data?.some((plant) => plant.remindersEnabled) ? (
          <Pressable onPress={() => void Linking.openSettings()} className="mb-1 rounded-2xl bg-accent-soft px-4 py-3">
            <Text className="text-[14px] leading-5 text-accent">{t('plants.remindersOff')}</Text>
          </Pressable>
        ) : undefined
      }
      ListEmptyComponent={plants.isPending ? <ActivityIndicator className="py-10" /> : undefined}
    />
  );
}
