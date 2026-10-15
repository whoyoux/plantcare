import type { ConfigContext, ExpoConfig } from 'expo/config';

// From `eas init` (EAS project whoyoux/plantcare) and the Apple Developer membership page.
const EAS_PROJECT_ID = 'bc1f2d71-5e29-4337-8d4f-1cece9d9b962';
const EAS_OWNER = 'whoyoux';
const APPLE_TEAM_ID = '73SQTP34GN';

const VARIANTS = {
  production: {
    name: 'PlantCare',
    bundleIdentifier: 'dev.whxx.plantcare',
    scheme: 'plantcare',
  },
  preview: {
    name: 'PlantCare Preview',
    bundleIdentifier: 'dev.whxx.plantcare.preview',
    scheme: 'plantcare-preview',
  },
  development: {
    name: 'PlantCare Dev',
    bundleIdentifier: 'dev.whxx.plantcare.dev',
    scheme: 'plantcare-dev',
  },
} as const;

type AppVariant = keyof typeof VARIANTS;

function resolveVariant(value: string | undefined): AppVariant {
  // Default to production so a build without APP_VARIANT never ships a dev identity.
  if (value === undefined || value === '') return 'production';
  if (value in VARIANTS) return value as AppVariant;
  throw new Error(`Unknown APP_VARIANT "${value}". Expected one of: ${Object.keys(VARIANTS).join(', ')}`);
}

const variant = resolveVariant(process.env.APP_VARIANT);
const { name, bundleIdentifier, scheme } = VARIANTS[variant];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name,
  slug: 'plantcare',
  owner: EAS_OWNER,
  version: '1.0.0',
  scheme,
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  runtimeVersion: { policy: 'fingerprint' },
  updates: { url: `https://u.expo.dev/${EAS_PROJECT_ID}` },
  ios: {
    bundleIdentifier,
    appleTeamId: APPLE_TEAM_ID,
    icon: './assets/expo.icon',
    supportsTablet: false,
    usesAppleSignIn: true,
    config: { usesNonExemptEncryption: false },
    entitlements: {
      'com.apple.security.application-groups': [`group.${bundleIdentifier}`],
    },
  },
  android: {
    package: bundleIdentifier,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '17.0',
          // iOS 27 kills apps without the UIScene lifecycle. Remove once on SDK 58+, where it's the default.
          enableSceneSupport: true,
        },
      },
    ],
    'expo-apple-authentication',
    'expo-secure-store',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    appVariant: variant,
    eas: { projectId: EAS_PROJECT_ID },
  },
});
