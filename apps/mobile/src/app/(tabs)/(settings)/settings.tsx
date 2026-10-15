import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Form, FormPicker, FormRow, FormSection } from '@/components/native/form';
import { changeLanguage, languages, type Language } from '@/i18n';
import { appVariant, isProduction } from '@/lib/app-variant';
import {
  getLanguagePreference,
  getThemePreference,
  setThemePreference,
  type LanguagePreference,
  type ThemePreference,
} from '@/lib/dev-preferences';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();

  return (
    <View className="flex-1 bg-background">
      <Form>
        <FormSection title={t('settings.account')}>
          <FormRow label={t('settings.signIn')} value={t('settings.comingSoon')} systemImage="apple.logo" disabled />
        </FormSection>

        <FormSection title={t('settings.general')} footer={t('settings.languageFooter')}>
          <FormRow
            label={t('settings.language')}
            value={t(`languages.${i18n.language as Language}`)}
            systemImage="globe"
            onPress={() => void Linking.openSettings()}
          />
        </FormSection>

        <FormSection title={t('settings.about')}>
          <FormRow label={t('settings.version')} value={Constants.expoConfig?.version ?? '–'} systemImage="info.circle" />
        </FormSection>

        {!isProduction && <DeveloperSection />}
      </Form>
    </View>
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
      <FormRow label={t('settings.runtimeVersion')} value={Updates.runtimeVersion?.slice(0, 12) ?? '–'} systemImage="cpu" />
      <FormRow label={t('settings.channel')} value={Updates.channel || '–'} systemImage="antenna.radiowaves.left.and.right" />
    </FormSection>
  );
}
