import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Form, FormRow, FormSection } from '@/components/native/form';
import type { Language } from '@/i18n';

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
      </Form>
    </View>
  );
}
