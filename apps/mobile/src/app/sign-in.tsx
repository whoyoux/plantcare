import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from '@/components/image';
import { haptics } from '@/lib/haptics';
import { PRIVACY_URL, TERMS_URL } from '@/lib/legal';
import { availableProviders, signIn, type Provider } from '@/lib/sign-in';

export default function SignInScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const [pending, setPending] = useState<Provider | null>(null);
  const insets = useSafeAreaInsets();

  async function handleSignIn(provider: Provider) {
    setPending(provider);
    try {
      // On success the session updates and the protected routes take over.
      if (await signIn(provider)) haptics.success();
    } catch (error) {
      console.warn(error);
      haptics.error();
      Alert.alert(t('signIn.failed'));
    } finally {
      setPending(null);
    }
  }

  return (
    <View className="flex-1 bg-background px-6" style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 8 }}>
      <View className="flex-1 items-center justify-center gap-5">
        <Image
          source={require('@/assets/icons/splash.png')}
          className="size-40"
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
        <Text className="font-rounded text-[38px] font-extrabold tracking-tight text-foreground">PlantCare</Text>
        <Text className="max-w-[280px] text-center text-[17px] leading-6 text-muted">{t('signIn.pitch')}</Text>

        <View className="mt-2 gap-0.5 rounded-2xl bg-card px-4 py-3">
          <Text className="font-rounded text-[15px] font-bold text-foreground">{t('signIn.exampleName')}</Text>
          <Text className="font-latin text-[14px] italic text-muted">Monstera deliciosa</Text>
          <Text className="text-[13px] font-semibold text-accent">{t('signIn.exampleCare')}</Text>
        </View>
      </View>

      <View className="gap-3 pb-2">
        {pending ? (
          <View className="h-[110px] items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : (
          availableProviders.map((provider) =>
            provider === 'apple' ? (
              <AppleAuthentication.AppleAuthenticationButton
                key={provider}
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={
                  colorScheme === 'dark'
                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={14}
                style={{ height: 50 }}
                onPress={() => void handleSignIn('apple')}
              />
            ) : (
              <Pressable
                key={provider}
                accessibilityRole="button"
                onPress={() => void handleSignIn('google')}
                className="h-[50px] flex-row items-center justify-center gap-2 rounded-[14px] border border-separator bg-card active:opacity-70"
              >
                <Image source={require('@/assets/images/google-g.png')} className="size-[18px]" />
                <Text className="text-[17px] font-semibold text-foreground">{t('signIn.google')}</Text>
              </Pressable>
            ),
          )
        )}

        <Text className="px-4 text-center text-[12px] leading-4 text-muted">
          {t('signIn.legalPrefix')}{' '}
          <Text className="underline" onPress={() => void WebBrowser.openBrowserAsync(TERMS_URL)}>
            {t('signIn.terms')}
          </Text>{' '}
          {t('signIn.and')}{' '}
          <Text className="underline" onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_URL)}>
            {t('signIn.privacy')}
          </Text>
          .
        </Text>
      </View>
    </View>
  );
}
