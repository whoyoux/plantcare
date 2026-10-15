import en from './locales/en';
import pl from './locales/pl';

export const resources = {
  en: { translation: en },
  pl: { translation: pl },
} as const;

export type Language = keyof typeof resources;

export const languages = Object.keys(resources) as Language[];

export function isLanguage(code: string | null): code is Language {
  return code !== null && code in resources;
}
