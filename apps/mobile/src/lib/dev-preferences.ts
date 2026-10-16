import { File, Paths } from 'expo-file-system';
import { Uniwind } from 'uniwind';

import type { Language } from '@/i18n/resources';
import { isProduction } from '@/lib/app-variant';

export type ThemePreference = 'system' | 'light' | 'dark';
export type LanguagePreference = 'system' | Language;

type Preferences = { theme: ThemePreference; language: LanguagePreference };

const defaults: Preferences = { theme: 'system', language: 'system' };

// Small JSON file with synchronous IO, so overrides apply before the first render.
const file = new File(Paths.document, 'dev-preferences.json');

function load(): Preferences {
  // Developer overrides only exist outside production.
  if (isProduction || !file.exists) return defaults;
  try {
    return { ...defaults, ...(JSON.parse(file.textSync()) as Partial<Preferences>) };
  } catch {
    return defaults;
  }
}

function save(patch: Partial<Preferences>) {
  file.writeSync(JSON.stringify({ ...load(), ...patch }));
}

export function getThemePreference(): ThemePreference {
  return load().theme;
}

export function getLanguagePreference(): LanguagePreference {
  return load().language;
}

export function setThemePreference(theme: ThemePreference) {
  save({ theme });
  Uniwind.setTheme(theme);
}

export function setLanguagePreference(language: LanguagePreference) {
  save({ language });
}

/** Applies the stored theme; call once at startup. */
export function applyStoredTheme() {
  const { theme } = load();
  if (theme !== 'system') Uniwind.setTheme(theme);
}
