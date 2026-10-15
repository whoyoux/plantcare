import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import pl from './locales/pl';

export const resources = {
  en: { translation: en },
  pl: { translation: pl },
} as const;

export type Language = keyof typeof resources;

function isLanguage(code: string | null): code is Language {
  return code !== null && code in resources;
}

// iOS restarts the app when its language changes, so reading it once at startup is enough.
export function getDeviceLanguage(): Language {
  for (const { languageCode } of getLocales()) {
    if (isLanguage(languageCode)) return languageCode;
  }
  return 'en';
}

void i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
