import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Image } from '@/components/image';
import { Button } from '@/components/native/button';
import { pickPhoto, type PhotoSource } from '@/lib/pick-photo';

export default function IdentifyScreen() {
  const { t } = useTranslation();

  async function identify(source: PhotoSource) {
    void Haptics.selectionAsync();
    try {
      const uri = await pickPhoto(source);
      if (uri) router.push({ pathname: '/result', params: { uri } });
    } catch {
      // e.g. no camera on the simulator
      Alert.alert(t('identify.cameraUnavailable'));
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-10 px-6 pb-10 pt-8"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="items-center gap-4">
        <View className="size-36 items-center justify-center rounded-full bg-accent-soft">
          <Image source={require('@/assets/icons/splash.png')} className="size-24" contentFit="contain" />
        </View>
        <Text className="text-center text-[28px] font-bold text-foreground">{t('identify.heading')}</Text>
        <Text className="text-center text-[17px] leading-6 text-muted">{t('identify.description')}</Text>
      </View>

      <View className="gap-3">
        <Button label={t('identify.takePhoto')} systemImage="camera.fill" onPress={() => identify('camera')} />
        <Button
          label={t('identify.chooseFromLibrary')}
          systemImage="photo.on.rectangle"
          variant="secondary"
          onPress={() => identify('library')}
        />
      </View>
    </ScrollView>
  );
}
