import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HerbariumCard } from '@/components/herbarium';
import { PhotoTips } from '@/components/home';
import { Image } from '@/components/image';
import { GlassCircle, PillButton, useColor } from '@/components/photo-ui';
import { DueToday } from '@/components/plant-care';
import { openSaved } from '@/components/plant-row';
import { useHerbarium } from '@/lib/herbarium';
import { useHistory } from '@/lib/identifications';
import { openNewResult } from '@/lib/identify';
import { pickPhotos } from '@/lib/pick-photo';

const HERO_HEIGHT = 440;

async function chooseFromLibrary() {
  const uris = await pickPhotos();
  if (uris.length > 0) openNewResult(uris);
}

/**
 * Home: the latest find big, then what needs water and the herbarium. The camera is the round
 * button next to the tab bar; settings sit behind the gear on the photo.
 */
export default function HomeScreen() {
  const history = useHistory();
  const latest = history.data?.pages[0]?.items[0];

  return (
    <ScrollView className="flex-1 bg-background" contentInsetAdjustmentBehavior="never">
      {latest ? <LatestFind item={latest} /> : <Welcome loading={history.isPending} />}
      <View className="gap-7 px-4 pb-32 pt-6">
        <DueToday />
        <HerbariumCard />
        {!latest && !history.isPending && <PhotoTips />}
      </View>
    </ScrollView>
  );
}

function SettingsButton() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View className="absolute right-4" style={{ top: insets.top + 8 }}>
      <GlassCircle icon="gearshape.fill" label={t('settings.title')} onPress={() => router.push('/settings')} />
    </View>
  );
}

/** The most recent identification, edge to edge; tapping it opens the result. */
function LatestFind({
  item,
}: {
  item: NonNullable<ReturnType<typeof useHistory>['data']>['pages'][number]['items'][number];
}) {
  const { t } = useTranslation();
  const herbarium = useHerbarium();
  const number = herbarium.data?.speciesCount;

  return (
    <View style={{ height: HERO_HEIGHT }} className="bg-elevated">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.commonName ?? item.scientificName}
        onPress={() => openSaved(item.id)}
        className="flex-1 active:opacity-90"
      >
        <Image
          source={{ uri: item.imageUrl, cacheKey: item.id }}
          contentFit="cover"
          transition={200}
          style={{ width: '100%', height: HERO_HEIGHT }}
        />
        <View className="absolute bottom-4 left-4 right-4 gap-1 rounded-[22px] bg-black/60 px-4 py-3.5">
          <Text className="text-[12px] font-semibold uppercase tracking-wider text-[#BFE6C9]">
            {number ? t('home.latestNumbered', { number }) : t('home.latest')}
          </Text>
          <Text numberOfLines={1} className="text-[26px] font-bold tracking-tight text-white">
            {item.commonName ?? item.scientificName}
          </Text>
          <Text numberOfLines={1} className="font-latin text-[15px] italic text-white/80">
            {item.scientificName}
          </Text>
        </View>
      </Pressable>
      <SettingsButton />
    </View>
  );
}

/** Before the first identification: what the app does and how to start. */
function Welcome({ loading }: { loading: boolean }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const accent = useColor('--color-accent');

  return (
    <View className="gap-5 bg-card px-5 pb-7" style={{ paddingTop: insets.top + 72 }}>
      {!loading && (
        <>
          <View className="size-16 items-center justify-center rounded-[20px] bg-accent-soft">
            <SymbolView name="camera.macro" size={32} tintColor={accent} />
          </View>
          <View className="gap-2">
            <Text className="text-[32px] font-bold leading-[38px] tracking-tight text-foreground">
              {t('identify.cardTitle')}
            </Text>
            <Text className="text-[16px] leading-6 text-muted">{t('identify.cardDescription')}</Text>
          </View>
          <View className="gap-2.5">
            <PillButton label={t('identify.takePhoto')} icon="camera.fill" onPress={() => router.navigate('/scan')} />
            <PillButton
              label={t('identify.chooseFromLibrary')}
              icon="photo.on.rectangle"
              variant="secondary"
              onPress={() => void chooseFromLibrary()}
            />
          </View>
        </>
      )}
      <SettingsButton />
    </View>
  );
}
