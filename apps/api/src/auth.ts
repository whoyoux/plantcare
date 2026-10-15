import { expo } from '@better-auth/expo';
import { authAdapter, type Database } from '@plantcare/db';
import { betterAuth } from 'better-auth';

import type { ApiEnv } from '../alchemy.run';
import { GOOGLE_WEB_CLIENT_ID, stageConfig } from './config';

/** Better Auth is created per request because the DB client is per request (Hyperdrive). */
export function createAuth(env: ApiEnv, db: Database) {
  const { bundleIds, schemes } = stageConfig(env.STAGE);

  return betterAuth({
    baseURL: env.API_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: authAdapter(db),
    trustedOrigins: [...schemes, 'https://appleid.apple.com'],
    socialProviders: {
      // Native Sign in with Apple only (ID token from expo-apple-authentication); the token's
      // audience is the app's bundle ID, so no Service ID or client secret is needed here.
      apple: {
        clientId: [...bundleIds],
        audience: [...bundleIds],
        clientSecret: '',
      },
      // Native Google Sign-In (ID token); the web client ID is the token audience.
      ...(GOOGLE_WEB_CLIENT_ID ? { google: { clientId: GOOGLE_WEB_CLIENT_ID, clientSecret: '' } } : {}),
    },
    plugins: [expo()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
