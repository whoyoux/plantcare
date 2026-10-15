import Constants from 'expo-constants';

export type AppVariant = 'development' | 'preview' | 'production';

// Set in app.config.ts from APP_VARIANT at build time.
export const appVariant = (Constants.expoConfig?.extra?.appVariant ?? 'production') as AppVariant;

export const isProduction = appVariant === 'production';
