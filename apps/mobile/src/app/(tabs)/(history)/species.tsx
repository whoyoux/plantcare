import { Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Image } from '@/components/image';
import { Button } from '@/components/native/button';
import { EmptyState } from '@/components/native/empty-state';
import { openSaved } from '@/components/plant-row';
import { useHerbarium } from '@/lib/herbarium';

/** One species from the herbarium: its photos, when it was first found, and a way to the full result. */
export default function SpeciesScreen() {
  const { t, i18n } = useTranslation();
  const { key } = useLocalSearchParams<{ key: string }>();
  const herbarium = useHerbarium();
  const danger = useCSSVariable('--color-danger');
  const species = herbarium.data?.species.find((item) => item.key === key);

  if (herbarium.isPending) return <ActivityIndicator className="flex-1 bg-background" />;
  // Deleted from History in the meantime.
  if (!species) return <EmptyState title={t('herbarium.emptyTitle')} systemImage="books.vertical" />;

  const name = species.commonName ?? species.scientificName;
  const date = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <Stack.Screen options={{ title: name }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 px-5 pb-10 pt-4"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Image
          source={{ uri: species.imageUrl, cacheKey: species.bestId }}
          contentFit="cover"
          className="aspect-[4/3] w-full rounded-3xl bg-card"
        />

        <View className="gap-1">
          <Text className="font-rounded text-[30px] font-extrabold leading-9 text-foreground">{name}</Text>
          <Text className="font-latin text-[19px] italic text-muted">
            {species.scientificName}
            {species.genusOnly && <Text className="text-[15px] not-italic"> · {t('herbarium.genus')}</Text>}
            {species.family && <Text className="font-latin text-[15px] not-italic"> · {species.family}</Text>}
          </Text>
        </View>

        <View className="overflow-hidden rounded-2xl bg-card">
          <Text className="px-4 py-3 text-[17px] text-foreground">
            {t('herbarium.discovered', { date: date.format(new Date(species.firstSeen)) })}
          </Text>
          <Text className="border-t border-separator px-4 py-3 text-[17px] text-foreground">
            {t('herbarium.seen', { count: species.count })}
          </Text>
          {species.toxic && (
            <View className="flex-row items-center gap-2 border-t border-separator px-4 py-3">
              <SymbolView
                name="exclamationmark.triangle.fill"
                size={18}
                tintColor={typeof danger === 'string' ? danger : undefined}
              />
              <Text className="text-[17px] font-semibold text-danger">{t('herbarium.toxic')}</Text>
            </View>
          )}
        </View>

        <View className="gap-2">
          <Text className="font-rounded text-[20px] font-bold text-foreground">{t('herbarium.photos')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2.5">
            {species.photos.map((photo) => (
              <Pressable
                key={photo.id}
                accessibilityRole="button"
                accessibilityLabel={date.format(new Date(photo.createdAt))}
                onPress={() => openSaved(photo.id)}
                className="active:opacity-70"
              >
                <Image
                  source={{ uri: photo.imageUrl, cacheKey: photo.id }}
                  contentFit="cover"
                  transition={150}
                  className="size-24 rounded-2xl bg-card"
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Button label={t('herbarium.showResult')} systemImage="leaf" onPress={() => openSaved(species.latestId)} />
      </ScrollView>
    </>
  );
}
