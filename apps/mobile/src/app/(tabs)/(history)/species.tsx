import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from '@/components/image';
import { EmptyState } from '@/components/native/empty-state';
import { GlassCircle, PhotoLabel, PillButton } from '@/components/photo-ui';
import { openSaved } from '@/components/plant-row';
import { useHerbarium } from '@/lib/herbarium';

const HERO_HEIGHT = 460;

/** One species from the herbarium: its photos big, when it was first found, and the full result. */
export default function SpeciesScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { key } = useLocalSearchParams<{ key: string }>();
  const herbarium = useHerbarium();
  const species = herbarium.data?.species.find((item) => item.key === key);
  const [selected, setSelected] = useState(0);

  if (herbarium.isPending) return <ActivityIndicator className="flex-1 bg-background" />;
  // Deleted from History in the meantime.
  if (!species) return <EmptyState title={t('herbarium.emptyTitle')} systemImage="books.vertical" />;

  const name = species.commonName ?? species.scientificName;
  const date = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' });
  const photo = species.photos[Math.min(selected, species.photos.length - 1)];
  const number = (herbarium.data?.species.length ?? 0) - (herbarium.data?.species.indexOf(species) ?? 0);

  return (
    <View className="flex-1 bg-card">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentInsetAdjustmentBehavior="never" className="flex-1">
        <View style={{ height: HERO_HEIGHT }} className="bg-elevated">
          <Image
            source={
              photo ? { uri: photo.imageUrl, cacheKey: photo.id } : { uri: species.imageUrl, cacheKey: species.bestId }
            }
            contentFit="cover"
            transition={150}
            style={{ width: '100%', height: HERO_HEIGHT }}
          />
          <View className="absolute bottom-12 left-4 flex-row gap-2">
            {species.toxic && <PhotoLabel tone="danger">{t('result.toxicBadge')}</PhotoLabel>}
            {species.photos.length > 1 && (
              <PhotoLabel>
                {Math.min(selected, species.photos.length - 1) + 1} / {species.photos.length}
              </PhotoLabel>
            )}
          </View>
        </View>

        <View className="-mt-8 min-h-[420px] gap-6 rounded-t-[30px] bg-card px-5 pb-12 pt-6">
          <View className="gap-1">
            <Text className="text-[12px] font-semibold uppercase tracking-wider text-accent">
              {t('herbarium.number', { number })}
            </Text>
            <Text className="text-[30px] font-bold leading-9 tracking-tight text-foreground">{name}</Text>
            <Text className="font-latin text-[17px] italic text-muted">
              {species.scientificName}
              {species.genusOnly && <Text className="text-[15px] not-italic"> · {t('herbarium.genus')}</Text>}
              {species.family && <Text className="text-[15px] not-italic"> · {species.family}</Text>}
            </Text>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 gap-0.5 rounded-2xl bg-elevated px-4 py-3">
              <Text className="text-[13px] text-muted">{t('herbarium.discoveredLabel')}</Text>
              <Text className="text-[16px] font-semibold text-foreground">
                {date.format(new Date(species.firstSeen))}
              </Text>
            </View>
            <View className="flex-1 gap-0.5 rounded-2xl bg-elevated px-4 py-3">
              <Text className="text-[13px] text-muted">{t('herbarium.seenLabel')}</Text>
              <Text className="text-[16px] font-semibold text-foreground">
                {t('herbarium.times', { count: species.count })}
              </Text>
            </View>
          </View>

          {species.photos.length > 1 && (
            <View className="gap-2">
              <Text className="text-[17px] font-bold text-foreground">{t('herbarium.photos')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2.5">
                {species.photos.map((item, index) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: index === selected }}
                    accessibilityLabel={date.format(new Date(item.createdAt))}
                    onPress={() => setSelected(index)}
                    className={`rounded-[16px] p-0.5 ${index === selected ? 'bg-accent' : ''}`}
                  >
                    <Image
                      source={{ uri: item.imageUrl, cacheKey: item.id }}
                      contentFit="cover"
                      transition={150}
                      className="size-20 rounded-[14px] bg-elevated"
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <PillButton
            label={t('herbarium.showResult')}
            icon="leaf.fill"
            onPress={() => openSaved(photo?.id ?? species.latestId)}
          />
        </View>
      </ScrollView>
      <View pointerEvents="box-none" className="absolute left-4" style={{ top: insets.top + 8 }}>
        <GlassCircle icon="chevron.left" label={t('herbarium.back')} onPress={() => router.back()} />
      </View>
    </View>
  );
}
