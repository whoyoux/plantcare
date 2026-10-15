import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

import { env } from '@/lib/env';

export const authClient = createAuthClient({
  baseURL: env.apiUrl,
  plugins: [
    expoClient({
      scheme: env.scheme,
      // Separate keychain entries per variant (Dev and Preview share a backend but not a session).
      storagePrefix: env.scheme,
      storage: SecureStore,
    }),
  ],
});
