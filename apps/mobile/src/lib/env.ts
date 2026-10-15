import Constants from 'expo-constants';
import { z } from 'zod';

const EnvSchema = z.object({
  apiUrl: z.url(),
  scheme: z.string().min(1),
  bundleId: z.string().min(1),
  google: z.object({
    webClientId: z.string(),
    iosClientId: z.string(),
  }),
});

const config = Constants.expoConfig;

/** Per-variant settings from app.config.ts. EXPO_PUBLIC_API_URL overrides the API (e.g. a local backend). */
export const env = EnvSchema.parse({
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? config?.extra?.apiUrl,
  scheme: Array.isArray(config?.scheme) ? config.scheme[0] : config?.scheme,
  bundleId: config?.ios?.bundleIdentifier,
  google: config?.extra?.google,
});
