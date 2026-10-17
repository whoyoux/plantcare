import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Image } from '@/components/image';
import type { HistoryItem } from '@/lib/identifications';

export function openSaved(id: string) {
  router.push({ pathname: '/result', params: { id } });
}

/** One identification in the History list: photo, name, Latin name and date. */
export function PlantRow({ item }: { item: HistoryItem }) {
  const { i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(
    new Date(item.createdAt),
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openSaved(item.id)}
      className="flex-row items-center gap-3 px-4 py-2.5 active:bg-card"
    >
      <Image
        source={{ uri: item.imageUrl, cacheKey: item.id }}
        contentFit="cover"
        transition={150}
        className="size-14 rounded-xl bg-card"
      />
      <View className="flex-1">
        <Text numberOfLines={1} className="text-[17px] font-semibold text-foreground">
          {item.commonName ?? item.scientificName}
        </Text>
        <Text numberOfLines={1} className="font-latin text-[15px] italic text-muted">
          {item.scientificName}
        </Text>
      </View>
      <Text className="text-[13px] text-muted">{date}</Text>
    </Pressable>
  );
}

/** Small card for the home screen's "Recently identified" row. */
export function PlantCard({ item }: { item: HistoryItem }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => openSaved(item.id)} className="w-32 gap-2 active:opacity-70">
      <Image
        source={{ uri: item.imageUrl, cacheKey: item.id }}
        contentFit="cover"
        transition={150}
        className="aspect-square w-32 rounded-2xl bg-card"
      />
      <Text numberOfLines={2} className="px-0.5 text-[15px] font-semibold leading-5 text-foreground">
        {item.commonName ?? item.scientificName}
      </Text>
    </Pressable>
  );
}
