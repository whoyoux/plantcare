import { router } from 'expo-router';
import type { SFSymbol } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Image } from '@/components/image';
import { openSaved } from '@/components/plant-row';
import { relativeDay } from '@/lib/dates';
import { useCollectionStats, useHistory, type HistoryItem } from '@/lib/identifications';

function useAccent() {
  const accent = useCSSVariable('--color-accent');
  return typeof accent === 'string' ? accent : undefined;
}

const tips = [
  { key: 'leaf', icon: 'leaf' },
  { key: 'flower', icon: 'camera.macro' },
  { key: 'light', icon: 'sun.max' },
] as const satisfies readonly { key: string; icon: SFSymbol }[];

/** Hints for a photo the model can identify well; sits right under the camera. */
export function PhotoTips() {
  const { t } = useTranslation();
  const accent = useAccent();

  return (
    <View className="gap-2.5">
      <Text className="px-1 font-rounded text-[17px] font-bold text-foreground">{t('identify.tipsTitle')}</Text>
      <View className="flex-row flex-wrap gap-2">
        {tips.map(({ key, icon }) => (
          <View key={key} className="flex-row items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5">
            <SymbolView name={icon} size={15} tintColor={accent} />
            <Text className="text-[14px] font-semibold text-accent">{t(`identify.tips.${key}`)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Plants, distinct species and this week's count. Hidden until the first identification. */
export function CollectionStats() {
  const { t } = useTranslation();
  const { data } = useCollectionStats();
  if (!data?.total) return null;

  const items = [
    { key: 'plants', value: data.total },
    { key: 'species', value: data.species },
    { key: 'thisWeek', value: data.thisWeek },
  ] as const;

  return (
    <View className="flex-row gap-2.5">
      {items.map(({ key, value }) => (
        <View key={key} className="flex-1 gap-0.5 rounded-2xl bg-card px-3.5 py-3">
          <Text className="text-[13px] text-muted">{t(`identify.stats.${key}`)}</Text>
          <Text className="font-rounded text-[26px] font-extrabold text-foreground">{value}</Text>
        </View>
      ))}
    </View>
  );
}

/** The four latest identifications in a 2×2 grid, with a shortcut to the full history. */
export function RecentPlants() {
  const { t } = useTranslation();
  const history = useHistory();
  const recent = history.data?.pages[0]?.items.slice(0, 4) ?? [];

  return (
    <View className="gap-2.5">
      <View className="flex-row items-baseline justify-between px-1">
        <Text className="font-rounded text-[20px] font-bold text-foreground">{t('identify.recent')}</Text>
        {recent.length > 0 && (
          <Pressable accessibilityRole="link" onPress={() => router.navigate('/history')} hitSlop={8}>
            <Text className="text-[15px] font-semibold text-accent">{t('identify.seeAll')}</Text>
          </Pressable>
        )}
      </View>
      {recent.length > 0 ? (
        <View className="flex-row flex-wrap gap-2.5">
          {recent.map((item) => (
            <PlantTile key={item.id} item={item} />
          ))}
        </View>
      ) : (
        <View className="rounded-2xl bg-card px-4 py-5">
          <Text className="text-[15px] text-muted">{t('identify.recentEmpty')}</Text>
        </View>
      )}
    </View>
  );
}

function PlantTile({ item }: { item: HistoryItem }) {
  const { t, i18n } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openSaved(item.id)}
      className="w-[48.5%] flex-row items-center gap-2.5 rounded-2xl bg-card p-2 active:opacity-70"
    >
      <Image
        source={{ uri: item.imageUrl, cacheKey: item.id }}
        contentFit="cover"
        transition={150}
        className="size-12 rounded-xl bg-accent-soft"
      />
      <View className="flex-1">
        <Text numberOfLines={1} className="text-[15px] font-semibold text-foreground">
          {item.commonName ?? item.scientificName}
        </Text>
        <Text numberOfLines={1} className="text-[13px] text-muted">
          {relativeDay(item.createdAt, i18n.language, {
            today: t('history.sections.today'),
            yesterday: t('history.sections.yesterday'),
          })}
        </Text>
      </View>
    </Pressable>
  );
}
