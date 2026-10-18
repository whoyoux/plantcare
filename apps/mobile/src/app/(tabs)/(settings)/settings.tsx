import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, View } from 'react-native';

import { Form, FormPicker, FormRow, FormSection } from '@/components/native/form';
import { changeLanguage, languages, type Language } from '@/i18n';
import { appVariant, isProduction } from '@/lib/app-variant';
import { authClient } from '@/lib/auth-client';
import { haptics } from '@/lib/haptics';
import {
  getLanguagePreference,
  getThemePreference,
  setThemePreference,
  type LanguagePreference,
  type ThemePreference,
} from '@/lib/dev-preferences';
import { deleteAccount, signOut } from '@/lib/sign-in';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();

  return (
    <View className="flex-1 bg-background">
      <Form title={t('settings.title')}>
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

function AccountSection() {
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();
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
    haptics.warning();
    Alert.alert(t('settings.deleteTitle'), t('settings.deleteMessage'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('settings.delete'),
        style: 'destructive',
        onPress: () => void run(deleteAccount, t('settings.deleteFailed')),
      },
    ]);
  }

  // The tabs are only reachable with a session (see app/_layout.tsx).
  if (!session) return null;

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
      {/* Which JS is running: the bundle inside the build, or an over-the-air update (and which). */}
      <FormRow
        label={t('settings.update')}
        value={Updates.isEmbeddedLaunch ? t('settings.updateEmbedded') : (Updates.updateId?.slice(0, 8) ?? '–')}
        systemImage="arrow.down.circle"
      />
    </FormSection>
  );
}
