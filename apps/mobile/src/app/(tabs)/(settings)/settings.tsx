import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, View } from 'react-native';

import { Form, FormPicker, FormRow, FormSection } from '@/components/native/form';
import { changeLanguage, languages, type Language } from '@/i18n';
import { appVariant, isProduction } from '@/lib/app-variant';
import { authClient } from '@/lib/auth-client';
import {
  getLanguagePreference,
  getThemePreference,
  setThemePreference,
  type LanguagePreference,
  type ThemePreference,
} from '@/lib/dev-preferences';
import { availableProviders, deleteAccount, signIn, signOut, type Provider } from '@/lib/sign-in';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();

  return (
    <View className="flex-1 bg-background">
      <Form>
        <AccountSection />

        <FormSection title={t('settings.general')} footer={t('settings.languageFooter')}>
          <FormRow
            label={t('settings.language')}
            value={t(`languages.${i18n.language as Language}`)}
            systemImage="globe"
            onPress={() => void Linking.openSettings()}
          />
        </FormSection>

        <FormSection title={t('settings.about')}>
          <FormRow
            label={t('settings.version')}
            value={Constants.expoConfig?.version ?? '–'}
            systemImage="info.circle"
          />
        </FormSection>

        {!isProduction && <DeveloperSection />}
      </Form>
    </View>
  );
}

const providerRows = {
  apple: { label: 'settings.signInApple', icon: 'apple.logo' },
  google: { label: 'settings.signInGoogle', icon: 'g.circle' },
} as const;

function AccountSection() {
  const { t } = useTranslation();
  const { data: session, isPending } = authClient.useSession();
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>, failure: string) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      console.warn(error);
      Alert.alert(failure);
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(t('settings.deleteTitle'), t('settings.deleteMessage'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('settings.delete'),
        style: 'destructive',
        onPress: () => void run(deleteAccount, t('settings.deleteFailed')),
      },
    ]);
  }

  if (session) {
    return (
      <FormSection title={t('settings.account')}>
        <FormRow label={t('settings.name')} value={session.user.name || '–'} systemImage="person.crop.circle" />
        <FormRow label={t('settings.email')} value={session.user.email} systemImage="envelope" />
        <FormRow
          label={t('settings.signOut')}
          systemImage="rectangle.portrait.and.arrow.right"
          disabled={busy}
          onPress={() => void run(signOut, t('settings.signOutFailed'))}
        />
        <FormRow
          label={t('settings.deleteAccount')}
          systemImage="trash"
          destructive
          disabled={busy}
          onPress={confirmDelete}
        />
      </FormSection>
    );
  }

  return (
    <FormSection title={t('settings.account')} footer={t('settings.accountFooter')}>
      {availableProviders.map((provider: Provider) => (
        <FormRow
          key={provider}
          label={t(providerRows[provider].label)}
          systemImage={providerRows[provider].icon}
          disabled={busy || isPending}
          onPress={() => void run(() => signIn(provider), t('settings.signInFailed'))}
        />
      ))}
    </FormSection>
  );
}

function DeveloperSection() {
  const { t } = useTranslation();
  const [language, setLanguage] = useState(getLanguagePreference);
  const [theme, setTheme] = useState(getThemePreference);

  return (
    <FormSection title={t('settings.developer')} footer={t('settings.developerFooter')}>
      <FormPicker<LanguagePreference>
        label={t('settings.language')}
        systemImage="character.bubble"
        selection={language}
        options={[
          { value: 'system', label: t('settings.system') },
          ...languages.map((code) => ({ value: code, label: t(`languages.${code}`) })),
        ]}
        onChange={(value) => {
          setLanguage(value);
          changeLanguage(value);
        }}
      />
      <FormPicker<ThemePreference>
        label={t('settings.appearance')}
        systemImage="circle.lefthalf.filled"
        selection={theme}
        options={[
          { value: 'system', label: t('settings.system') },
          { value: 'light', label: t('settings.light') },
          { value: 'dark', label: t('settings.dark') },
        ]}
        onChange={(value) => {
          setTheme(value);
          setThemePreference(value);
        }}
      />
      <FormRow label={t('settings.variant')} value={appVariant} systemImage="shippingbox" />
      <FormRow
        label={t('settings.runtimeVersion')}
        value={Updates.runtimeVersion?.slice(0, 12) ?? '–'}
        systemImage="cpu"
      />
      <FormRow
        label={t('settings.channel')}
        value={Updates.channel || '–'}
        systemImage="antenna.radiowaves.left.and.right"
      />
    </FormSection>
  );
}
