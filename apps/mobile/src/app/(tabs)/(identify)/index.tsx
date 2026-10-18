import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Button } from '@/components/native/button';
import { Viewfinder } from '@/components/viewfinder';
import { CollectionStats, PhotoTips, RecentPlants } from '@/components/home';
import { DueToday } from '@/components/plant-care';
import { openNewResult } from '@/lib/identify';
import { pickPhotos } from '@/lib/pick-photo';

function openCamera() {
  router.push('/camera');
}

async function chooseFromLibrary() {
  const uris = await pickPhotos();
  if (uris.length > 0) openNewResult(uris);
}

export default function IdentifyScreen() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 px-4 pb-8 pt-2"
      contentInsetAdjustmentBehavior="automatic"
    >
      <IdentifyCard />

      <DueToday />
      <PhotoTips />
      <CollectionStats />
      <RecentPlants />
    </ScrollView>
  );
}

/**
 * Starts an identification. The camera opens full screen on request instead of running here, so
 * nothing is filmed just by opening the app.
 */
function IdentifyCard() {
  const { t } = useTranslation();
  const accent = useCSSVariable('--color-accent');

  return (
    <View className="gap-5 rounded-[32px] bg-card p-5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('identify.takePhoto')}
        onPress={openCamera}
        className="h-44 items-center justify-center rounded-3xl bg-accent-soft active:opacity-80"
      >
        <View className="absolute inset-5">
          <Viewfinder size={30} stroke={3} />
        </View>
        <SymbolView
          name="camera.macro"
          size={52}
          weight="medium"
          tintColor={typeof accent === 'string' ? accent : undefined}
        />
      </Pressable>
      <View className="gap-1.5 px-1">
        <Text className="font-rounded text-[24px] font-extrabold leading-7 text-foreground">
          {t('identify.cardTitle')}
        </Text>
        <Text className="text-[15px] leading-5 text-muted">{t('identify.cardDescription')}</Text>
      </View>
      <View className="gap-2.5">
        <Button label={t('identify.takePhoto')} systemImage="camera.fill" onPress={openCamera} />
        <Button
          label={t('identify.chooseFromLibrary')}
          systemImage="photo.on.rectangle"
          variant="secondary"
          onPress={() => void chooseFromLibrary()}
        />
      </View>
    </View>
  );
}
