import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { Image } from '@/components/image';
import { Button } from '@/components/native/button';
import { Viewfinder } from '@/components/viewfinder';
import { haptics } from '@/lib/haptics';
import { pickPhoto } from '@/lib/pick-photo';

/** Swap the camera for the result sheet, so closing the result lands back home. */
function showResult(uri: string) {
  router.replace({ pathname: '/result', params: { uri } });
}

async function chooseFromLibrary() {
  const uri = await pickPhoto('library');
  if (uri) showResult(uri);
}

/**
 * The full-screen camera. It only runs while this screen is open: from the home card, or the
 * "Identify a plant" quick action on the app icon.
 */
export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  // Opening the camera is the ask, so ask straight away the first time.
  const undetermined = permission?.status === 'undetermined';
  useEffect(() => {
    if (undetermined) void requestPermission();
  }, [undetermined, requestPermission]);

  if (!permission || undetermined) return <View className="flex-1 bg-black" />;
  if (!permission.granted) return <PermissionNeeded canAsk={permission.canAskAgain} onAllow={requestPermission} />;
  return <Camera />;
}

function Camera() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [torch, setTorch] = useState(false);

  async function takePhoto() {
    if (!camera.current || !ready) return;
    // Often silent while the camera runs; the result sheet confirms with its own haptic.
    haptics.tap();
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.8 });
      showResult(photo.uri);
    } catch (error) {
      console.warn(error);
      Alert.alert(t('identify.cameraUnavailable'));
    }
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={camera}
        style={{ flex: 1 }}
        facing="back"
        enableTorch={torch}
        animateShutter
        onCameraReady={() => setReady(true)}
      />

      <View
        className="absolute left-0 right-0 flex-row items-center justify-between px-5"
        style={{ top: insets.top + 8 }}
      >
        <GlassButton icon="xmark" label={t('identify.close')} onPress={() => router.back()} />
        <View pointerEvents="none" className="rounded-full bg-black/35 px-3 py-1.5">
          <Text className="text-[13px] font-semibold text-white">{t('identify.hint')}</Text>
        </View>
        <GlassButton
          icon={torch ? 'flashlight.on.fill' : 'flashlight.off.fill'}
          label={t('identify.torch')}
          onPress={() => {
            haptics.toggle(!torch);
            setTorch(!torch);
          }}
        />
      </View>

      <View
        pointerEvents="none"
        className="absolute left-10 right-10"
        style={{ top: insets.top + 96, bottom: insets.bottom + 170 }}
      >
        <Viewfinder size={34} stroke={3} className="border-white/90" />
      </View>

      <View
        className="absolute left-0 right-0 flex-row items-center justify-around"
        style={{ bottom: insets.bottom + 32 }}
      >
        <GlassButton
          icon="photo.on.rectangle"
          label={t('identify.chooseFromLibrary')}
          onPress={() => void chooseFromLibrary()}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('identify.takePhoto')}
          onPress={() => void takePhoto()}
          className="size-[78px] items-center justify-center rounded-full border-4 border-white active:opacity-70"
        >
          <View className="size-[62px] rounded-full bg-white" />
        </Pressable>
        {/* Balances the library button so the shutter stays centred. */}
        <View className="size-12" />
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
      hitSlop={6}
      className="size-12 items-center justify-center rounded-full border border-white/35 bg-white/20 active:opacity-70"
    >
      <SymbolView name={icon} size={22} tintColor="white" />
    </Pressable>
  );
}

function PermissionNeeded({ canAsk, onAllow }: { canAsk: boolean; onAllow: () => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const muted = useCSSVariable('--color-muted');

  return (
    <View className="flex-1 bg-background px-6" style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom }}>
      <View className="flex-row justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('identify.close')}
          onPress={() => router.back()}
          hitSlop={8}
          className="size-10 items-center justify-center rounded-full bg-card active:opacity-70"
        >
          <SymbolView
            name="xmark"
            size={16}
            weight="semibold"
            tintColor={typeof muted === 'string' ? muted : undefined}
          />
        </Pressable>
      </View>
      <View className="flex-1 items-center justify-center gap-4">
        <Image source={require('@/assets/icons/splash.png')} className="size-28" contentFit="contain" />
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
            onPress={() => void chooseFromLibrary()}
          />
        </View>
      </View>
    </View>
  );
}
