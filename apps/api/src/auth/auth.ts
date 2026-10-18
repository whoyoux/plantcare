import { expo } from '@better-auth/expo';
import { authAdapter, eq, schema, type Database } from '@plantcare/db';
import { betterAuth } from 'better-auth';

import type { ApiEnv } from '../../alchemy.run';
import { GOOGLE_WEB_CLIENT_ID, stageConfig } from '../config';
import { createPhotos } from '../services/photos';
import { appleTokens, revokeAppleAccess, type AppleTokensOptions } from './apple-tokens';

/** Better Auth is created per request because the DB client is per request (Hyperdrive). */
export function createAuth(env: ApiEnv, db: Database) {
  const { bundleIds, schemes } = stageConfig(env.STAGE);
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
    // Native ID-token sign-in only: the token's audience is the app (bundle ID / Google web client),
    // so no client secrets are needed here.
    socialProviders: {
      apple: { clientId: [...bundleIds], audience: [...bundleIds], clientSecret: '' },
      ...(GOOGLE_WEB_CLIENT_ID ? { google: { clientId: GOOGLE_WEB_CLIENT_ID, clientSecret: '' } } : {}),
    },
    // Sign-in is Apple/Google only, so there is no password to re-check; a session of any age may
    // delete its account (otherwise deletion would fail a day after signing in).
    session: { freshAge: 0 },
    user: {
      deleteUser: {
        enabled: true,
        // Better Auth then deletes the user, sessions and accounts; identifications cascade.
        beforeDelete: async (user) => {
          const accounts = await db.select().from(schema.account).where(eq(schema.account.userId, user.id));
          // Never block a deletion on Apple being unreachable.
          await revokeAppleAccess(apple, accounts).catch((error: unknown) =>
            console.error('Apple token revocation failed', error),
          );
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
