import { expo } from '@better-auth/expo';
import { authAdapter, type Database } from '@plantcare/db';
import { betterAuth } from 'better-auth';

import type { ApiEnv } from '../../alchemy.run';
import { stageConfig } from '../config';
import { createPhotos } from '../services/photos';
import { appleTokens, type AppleTokensOptions } from './apple-tokens';

/** Better Auth is created per request because the DB client is per request (Hyperdrive). */
export function createAuth(env: ApiEnv, db: Database) {
  const { bundleIds, schemes, googleClientIds } = stageConfig(env.STAGE);
  const apple: AppleTokensOptions = {
    key: { teamId: env.APPLE_TEAM_ID, keyId: env.APPLE_KEY_ID, privateKey: env.APPLE_PRIVATE_KEY },
    bundleIds,
  };
  const photos = createPhotos({ db, bucket: env.PHOTOS });

  return betterAuth({
    baseURL: env.API_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: authAdapter(db),
    trustedOrigins: [...schemes, 'https://appleid.apple.com'],
    // Native ID-token sign-in only, so no client secrets are needed. Apple tokens are issued to the
    // app's bundle ID (`audience` takes precedence over the Service ID setup of the web flow).
    // Google tokens carry the web client when the app sets it, and the iOS client otherwise.
    socialProviders: {
      apple: { clientId: [...bundleIds], audience: [...bundleIds], clientSecret: '' },
      google: { clientId: [...googleClientIds], clientSecret: '' },
    },
    session: {
      // A phone app stays signed in: 90 days, extended (at most daily) whenever it's used.
      expiresIn: 90 * 24 * 60 * 60,
      updateAge: 24 * 60 * 60,
      // Sign-in is Apple/Google only, so there is no password to re-check; a session of any age may
      // delete its account (otherwise deletion would fail a day after signing in).
      freshAge: 0,
    },
    // Provider tokens at rest (Apple's refresh token among them) are encrypted with the auth secret.
    account: { encryptOAuthTokens: true },
    user: {
      deleteUser: {
        enabled: true,
        // The apple-tokens plugin revokes Apple access first. Better Auth then deletes the user,
        // sessions and accounts; identifications cascade.
        beforeDelete: async (user) => {
          await photos.deleteAllForUser(user.id);
        },
      },
    },
    // Per isolate (in memory), so a backstop only; the zone's WAF rate limit does the heavy lifting.
    // Workers don't set NODE_ENV, so turn it on explicitly, keyed by the real client IP.
    rateLimit: { enabled: true, window: 60, max: 100 },
    advanced: { ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } },
    plugins: [expo(), appleTokens(apple)],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthUser = Auth['$Infer']['Session']['user'];
