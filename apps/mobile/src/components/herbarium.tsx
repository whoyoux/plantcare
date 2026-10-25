import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionSheetIOS, ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Image } from '@/components/image';
import { Button } from '@/components/native/button';
import { EmptyState } from '@/components/native/empty-state';
import { PhotoLabel } from '@/components/photo-ui';
import { BADGE_SYMBOLS, badgeName } from '@/lib/badges';
import {
  herbariumRows,
  matchesSearch,
  useHerbarium,
  type Badge,
  type GridRow,
  type HerbariumSort,
  type Species,
} from '@/lib/herbarium';

function useColor(name: string) {
  const value = useCSSVariable(name);
  return typeof value === 'string' ? value : undefined;
}

export function openSpecies(key: string) {
  router.push({ pathname: '/species', params: { key } });
}

export function openBadges() {
  router.push('/badges');
}

/** A round badge medal: tinted when earned, grey while locked. */
export function Medal({ badge, size = 40 }: { badge: Pick<Badge, 'id' | 'level'>; size?: number }) {
  const accent = useColor('--color-accent');
  const muted = useColor('--color-muted');
  const earned = badge.level > 0;
  return (
    <View
      style={{ width: size, height: size }}
      className={`items-center justify-center rounded-full ${earned ? 'bg-accent-soft' : 'bg-background opacity-60'}`}
    >
      <SymbolView name={BADGE_SYMBOLS[badge.id]} size={size * 0.48} tintColor={earned ? accent : muted} />
    </View>
  );
}

/** A thin progress bar for badge progress. */
export function ProgressBar({ value }: { value: number }) {
  return (
    <View className="h-1.5 overflow-hidden rounded-full bg-separator">
      <View className="h-full rounded-full bg-accent" style={{ width: `${Math.round(Math.min(1, value) * 100)}%` }} />
    </View>
  );
}

const SORTS: HerbariumSort[] = ['newest', 'name', 'family'];
const SORT_LABELS = {
  newest: 'herbarium.sortNewest',
  name: 'herbarium.sortName',
  family: 'herbarium.sortFamily',
} as const;

/**
 * The herbarium: one photo tile per species found (the latest one wide when newest first), with
 * the next badge's progress on top. `header` is the Herbarium/History switcher, above everything.
 */
export function HerbariumView({ header, search }: { header: ReactNode; search: string }) {
  const { t, i18n } = useTranslation();
  const herbarium = useHerbarium();
  const [sort, setSort] = useState<HerbariumSort>('newest');
  const [pulling, setPulling] = useState(false);

  const species = useMemo(
    () => (herbarium.data?.species ?? []).filter((item) => !search || matchesSearch(item, search)),
    [herbarium.data, search],
  );
  const rows = useMemo(
    () => herbariumRows(species, sort, i18n.language, t('herbarium.otherFamily')),
    [species, sort, i18n.language, t],
  );

  function chooseSort() {
    const options = [...SORTS.map((value) => t(SORT_LABELS[value])), t('herbarium.cancel')];
    ActionSheetIOS.showActionSheetWithOptions(
      { title: t('herbarium.sort'), options, cancelButtonIndex: SORTS.length },
      (index) => {
        const value = SORTS[index];
        if (value) setSort(value);
      },
    );
  }

  async function refresh() {
    setPulling(true);
    await herbarium.refetch();
    setPulling(false);
  }

  // Static empty and error screens (an empty list would still scroll by the header insets).
  if (!herbarium.isPending && species.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <View className="pt-2">{header}</View>
        {herbarium.isError ? (
          <View className="flex-1 gap-4 px-6">
            <EmptyState title={t('herbarium.loadFailed')} systemImage="exclamationmark.triangle" />
            <Button label={t('history.retry')} variant="secondary" onPress={() => void herbarium.refetch()} />
          </View>
        ) : search ? (
          <EmptyState title={t('herbarium.noResults', { query: search })} systemImage="magnifyingglass" />
        ) : (
          <EmptyState
            title={t('herbarium.emptyTitle')}
            description={t('herbarium.emptyDescription')}
            systemImage="books.vertical"
          />
        )}
      </View>
    );
  }

  const data = herbarium.data;
  return (
    <FlatList<GridRow>
      className="flex-1 bg-background"
      data={rows}
      keyExtractor={(row) => row.key}
      renderItem={({ item: row }) =>
        row.type === 'heading' ? (
          <Text className="px-5 pb-2 pt-4 text-[15px] font-bold text-muted">{row.title}</Text>
        ) : row.type === 'featured' ? (
          <View className="px-4 pb-2.5">
            <SpeciesTile species={row.item} height={240} />
          </View>
        ) : (
          <View className="flex-row gap-2.5 px-4 pb-2.5">
            {[0, 1].map((slot) => {
              const item = row.items[slot];
              return item ? (
                <View key={item.key} className="flex-1">
                  <SpeciesTile species={item} height={170} />
                </View>
              ) : (
                <View key={slot} className="flex-1" />
              );
            })}
          </View>
        )
      }
      ListHeaderComponent={
        <View className="gap-3 pb-3 pt-2">
          {header}
          {data && (
            <View className="mx-4 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-[15px] text-muted">
                  {t('herbarium.species', { count: data.speciesCount })} ·{' '}
                  {t('herbarium.families', { count: data.familyCount })}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('herbarium.sort')}
                  onPress={chooseSort}
                  hitSlop={8}
                  className="rounded-full bg-elevated px-3.5 py-2 active:opacity-70"
                >
                  <Text className="text-[14px] font-semibold text-foreground">{t(SORT_LABELS[sort])}</Text>
                </Pressable>
              </View>
              <NextBadge data={data} />
            </View>
          )}
        </View>
      }
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="pb-8"
      refreshing={pulling}
      onRefresh={() => void refresh()}
      ListEmptyComponent={herbarium.isPending ? <ActivityIndicator className="py-10" /> : undefined}
    />
  );
}

/** A species as a photo with its name on it, the toxic warning and how often it was found. */
function SpeciesTile({ species, height }: { species: Species; height: number }) {
  const { t } = useTranslation();
  const name = species.commonName ?? species.scientificName;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={species.toxic ? `${name}, ${t('result.toxicBadge')}` : name}
      onPress={() => openSpecies(species.key)}
      className="overflow-hidden rounded-[22px] bg-elevated active:opacity-80"
      style={{ height }}
    >
      <Image
        source={{ uri: species.imageUrl, cacheKey: species.bestId }}
        contentFit="cover"
        transition={150}
        style={{ width: '100%', height }}
      />
      {species.toxic && (
        <View className="absolute left-2 top-2">
          <PhotoLabel tone="danger">{t('result.toxicBadge')}</PhotoLabel>
        </View>
      )}
      <View className="absolute bottom-2 left-2 right-2 rounded-[14px] bg-black/60 px-3 py-2">
        <Text numberOfLines={1} className="text-[14px] font-semibold text-white">
          {name}
        </Text>
        <Text numberOfLines={1} className="text-[12px] text-white/80">
          {species.genusOnly ? t('herbarium.genus') : species.scientificName}
          {species.count > 1 ? ` · ×${species.count}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

/** The badge closest to its next level, with a link to every badge. */
function NextBadge({ data }: { data: NonNullable<ReturnType<typeof useHerbarium>['data']> }) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={openBadges}
      className="flex-row items-center gap-3 rounded-[20px] bg-card px-3.5 py-3 active:opacity-80"
    >
      {data.next ? (
        <>
          <Medal badge={{ id: data.next.id, level: 1 }} size={40} />
          <View className="flex-1 gap-1.5">
            <View className="flex-row justify-between">
              <Text className="text-[15px] font-semibold text-foreground">{badgeName(data.next, t, true)}</Text>
              <Text className="text-[13px] text-muted">
                {t('herbarium.progress', { current: data.next.current, target: data.next.target })}
              </Text>
            </View>
            <ProgressBar value={data.next.current / data.next.target} />
          </View>
        </>
      ) : (
        <Text className="flex-1 text-[15px] font-semibold text-accent">{t('herbarium.allBadges')}</Text>
      )}
      <Text className="text-[14px] font-semibold text-accent">{t('herbarium.badges')}</Text>
    </Pressable>
  );
}

/** Home screen summary: counts, the next badge with its progress, latest finds. */
export function HerbariumCard() {
  const { t } = useTranslation();
  const { data } = useHerbarium();
  if (!data) return null;

  const latestBadge = data.badges
    .filter((badge) => badge.earnedAt)
    .sort((a, b) => (b.earnedAt ?? '').localeCompare(a.earnedAt ?? ''))[0];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.navigate({ pathname: '/history', params: { view: 'herbarium', at: String(Date.now()) } })}
      className="gap-3 rounded-2xl bg-card p-4 active:opacity-80"
    >
      <View className="flex-row items-baseline justify-between">
        <Text className="font-rounded text-[20px] font-bold text-foreground">{t('herbarium.cardTitle')}</Text>
        <Text className="text-[17px] font-semibold text-accent">›</Text>
      </View>

      {data.speciesCount === 0 ? (
        <Text className="text-[15px] text-muted">{t('herbarium.cardEmpty')}</Text>
      ) : (
        <>
          <Text className="text-[15px] text-muted">
            {t('herbarium.species', { count: data.speciesCount })} ·{' '}
            {t('herbarium.families', { count: data.familyCount })}
          </Text>

          {data.next ? (
            <View className="flex-row items-center gap-3">
              <Medal badge={{ id: data.next.id, level: 0 }} size={36} />
              <View className="flex-1 gap-1.5">
                <View className="flex-row justify-between">
                  <Text className="text-[15px] font-semibold text-foreground">{badgeName(data.next, t, true)}</Text>
                  <Text className="text-[13px] text-muted">
                    {t('herbarium.progress', { current: data.next.current, target: data.next.target })}
                  </Text>
                </View>
                <ProgressBar value={data.next.current / data.next.target} />
              </View>
            </View>
          ) : (
            <Text className="text-[15px] font-semibold text-accent">{t('herbarium.allBadges')}</Text>
          )}

          <View className="flex-row items-center gap-2">
            {data.species.slice(0, 3).map((item) => (
              <Image
                key={item.key}
                source={{ uri: item.imageUrl, cacheKey: item.bestId }}
                contentFit="cover"
                className="size-11 rounded-xl bg-accent-soft"
              />
            ))}
            <View className="flex-1" />
            {latestBadge && (
              <View className="flex-row items-center gap-1.5">
                <Medal badge={latestBadge} size={28} />
                <Text numberOfLines={1} className="max-w-[140px] text-[13px] font-semibold text-foreground">
                  {badgeName(latestBadge, t)}
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </Pressable>
  );
}
