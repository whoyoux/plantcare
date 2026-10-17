const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'src/uniwind-types.d.ts'],
  },
  {
    // Hermes (the app's JS engine) lacks these; using one crashes the app at runtime
    // (Intl.PluralRules is polyfilled in src/i18n).
    files: ['src/**'],
    rules: {
      'no-restricted-properties': [
        'error',
        ...['RelativeTimeFormat', 'ListFormat', 'Segmenter', 'DisplayNames', 'DurationFormat'].map((property) => ({
          object: 'Intl',
          property,
          message: 'Not available in Hermes. Use translated strings and Intl.DateTimeFormat instead.',
        })),
      ],
    },
  },
  {
    // Node scripts (icon generation, configs).
    files: ['scripts/**', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  // Formatting is Prettier's job; turn off rules that conflict with it.
  prettier,
]);
