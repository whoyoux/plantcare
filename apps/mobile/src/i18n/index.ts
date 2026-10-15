import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getLanguagePreference, setLanguagePreference, type LanguagePreference } from '@/lib/dev-preferences';

import { isLanguage, resources, type Language } from './resources';

export { languages, type Language } from './resources';

// iOS restarts the app when its language changes, so reading it once at startup is enough.
export function getDeviceLanguage(): Language {
  for (const { languageCode } of getLocales()) {
    if (isLanguage(languageCode)) return languageCode;
  }
  return 'en';
}

function resolveLanguage(preference: LanguagePreference): Language {
  return preference === 'system' ? getDeviceLanguage() : preference;
}

/** Developer override; 'system' goes back to the device language. */
export function changeLanguage(preference: LanguagePreference) {
  setLanguagePreference(preference);
  void i18n.changeLanguage(resolveLanguage(preference));
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveLanguage(getLanguagePreference()),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
