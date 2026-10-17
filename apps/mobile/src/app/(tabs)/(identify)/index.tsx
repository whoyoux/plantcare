import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { Image } from '@/components/image';
import { Button } from '@/components/native/button';
import { Viewfinder } from '@/components/viewfinder';
import { CollectionStats, PhotoTips, RecentPlants } from '@/components/home';
import { DueToday } from '@/components/plant-care';
import { pickPhoto } from '@/lib/pick-photo';

function openResult(uri: string) {
  router.push({ pathname: '/result', params: { uri } });
}

export default function IdentifyScreen() {
  async function chooseFromLibrary() {
    void Haptics.selectionAsync();
    const uri = await pickPhoto('library');
    if (uri) openResult(uri);
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 px-4 pb-8 pt-2"
      contentInsetAdjustmentBehavior="automatic"
    >
      <CameraCard onChooseFromLibrary={() => void chooseFromLibrary()} />

      <DueToday />
      <PhotoTips />
      <CollectionStats />
      <RecentPlants />
    </ScrollView>
  );
}

function CameraCard({ onChooseFromLibrary }: { onChooseFromLibrary: () => void }) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [focused, setFocused] = useState(true);
  const [ready, setReady] = useState(false);
  const [torch, setTorch] = useState(false);

  // Only run the camera while this tab is on screen (battery, and the sheet covers it anyway).
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        setTorch(false);
      };
    }, []),
  );

  async function takePhoto() {
    if (!camera.current || !ready) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.8 });
      openResult(photo.uri);
    } catch (error) {
      console.warn(error);
      Alert.alert(t('identify.cameraUnavailable'));
    }
  }

  if (!permission?.granted) {
    return (
      <PermissionCard
        canAsk={permission?.canAskAgain ?? true}
        onAllow={() => void requestPermission()}
        onChooseFromLibrary={onChooseFromLibrary}
      />
    );
  }

  return (
    <View className="h-[440px] overflow-hidden rounded-[32px] bg-black">
      <CameraView
        ref={camera}
        style={{ flex: 1 }}
        facing="back"
        active={focused}
        enableTorch={torch}
        animateShutter
        onCameraReady={() => setReady(true)}
      />

      <View pointerEvents="none" className="absolute left-0 right-0 top-4 items-center">
        <View className="rounded-full bg-black/35 px-3 py-1.5">
          <Text className="text-[13px] font-semibold text-white">{t('identify.hint')}</Text>
        </View>
      </View>
      <View pointerEvents="none" className="absolute bottom-28 left-10 right-10 top-16">
        <Viewfinder size={34} stroke={3} className="border-white/90" />
      </View>

      <View className="absolute bottom-5 left-0 right-0 flex-row items-center justify-around">
        <GlassButton icon="photo.on.rectangle" label={t('identify.chooseFromLibrary')} onPress={onChooseFromLibrary} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('identify.takePhoto')}
          onPress={() => void takePhoto()}
          className="size-[74px] items-center justify-center rounded-full border-4 border-white active:opacity-70"
        >
          <View className="size-[58px] rounded-full bg-white" />
        </Pressable>
        <GlassButton
          icon={torch ? 'flashlight.on.fill' : 'flashlight.off.fill'}
          label={t('identify.torch')}
          onPress={() => setTorch((on) => !on)}
        />
      </View>
    </View>
  );
}

function GlassButton({ icon, label, onPress }: { icon: SFSymbol; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="size-12 items-center justify-center rounded-full border border-white/35 bg-white/20 active:opacity-70"
    >
      <SymbolView name={icon} size={22} tintColor="white" />
    </Pressable>
  );
}

function PermissionCard({
  canAsk,
  onAllow,
  onChooseFromLibrary,
}: {
  canAsk: boolean;
  onAllow: () => void;
  onChooseFromLibrary: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="items-center gap-4 rounded-[32px] bg-card px-6 py-8">
      <View className="size-32 items-center justify-center">
        <Viewfinder size={26} />
        <Image source={require('@/assets/icons/splash.png')} className="size-20" contentFit="contain" />
      </View>
      <Text className="text-center font-rounded text-[22px] font-bold text-foreground">
        {t('identify.cameraTitle')}
      </Text>
      <Text className="text-center text-[15px] leading-5 text-muted">{t('identify.cameraDescription')}</Text>
      <View className="w-full gap-3 pt-2">
        {canAsk ? (
          <Button label={t('identify.allowCamera')} systemImage="camera.fill" onPress={onAllow} />
        ) : (
          <Button label={t('identify.openSettings')} systemImage="gear" onPress={() => void Linking.openSettings()} />
        )}
        <Button
          label={t('identify.chooseFromLibrary')}
          systemImage="photo.on.rectangle"
          variant="secondary"
          onPress={onChooseFromLibrary}
        />
      </View>
    </View>
  );
}
