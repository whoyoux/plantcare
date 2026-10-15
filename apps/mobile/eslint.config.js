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
    // Node scripts (icon generation, configs).
    files: ['scripts/**', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  // Formatting is Prettier's job; turn off rules that conflict with it.
  prettier,
]);
