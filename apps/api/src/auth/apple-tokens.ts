import type { BetterAuthPlugin } from 'better-auth';
import { APIError, createAuthEndpoint, sessionMiddleware } from 'better-auth/api';
import { z } from 'zod';

import { audienceOf, exchangeAuthorizationCode, revokeRefreshToken, type AppleKey } from './apple';

export type AppleTokensOptions = {
  key: AppleKey;
  /** Bundle IDs allowed to sign in on this stage; Apple tokens are bound to one of them. */
  bundleIds: readonly string[];
};

/**
 * Keeps Apple's refresh token so the app can be disconnected from the user's Apple ID when the
 * account is deleted (required by App Review). Native sign-in only yields an ID token, so right
 * after signing in the app sends its one-time authorization code, which we exchange here and
 * store on the Apple account row.
 */
export const appleTokens = (options: AppleTokensOptions) =>
  ({
    id: 'apple-tokens',
    endpoints: {
      storeAppleAuthorizationCode: createAuthEndpoint(
        '/apple/authorization-code',
        {
          method: 'POST',
          use: [sessionMiddleware],
          body: z.object({ authorizationCode: z.string().min(1), bundleId: z.string() }),
        },
        async (ctx) => {
          const { authorizationCode, bundleId } = ctx.body;
          if (!options.key.keyId || !options.key.privateKey) {
            throw new APIError('SERVICE_UNAVAILABLE', { code: 'APPLE_KEY_NOT_CONFIGURED' });
          }
          if (!options.bundleIds.includes(bundleId)) throw new APIError('BAD_REQUEST', { code: 'INVALID_CLIENT' });

          const accounts = await ctx.context.internalAdapter.findAccounts(ctx.context.session.user.id);
          const apple = accounts.find((account) => account.providerId === 'apple');
          if (!apple) throw new APIError('NOT_FOUND', { code: 'APPLE_ACCOUNT_NOT_FOUND' });

          const refreshToken = await exchangeAuthorizationCode(options.key, bundleId, authorizationCode);
          await ctx.context.internalAdapter.updateAccount(apple.id, { refreshToken });
          return ctx.json({ stored: true });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;

/** Revokes the stored Apple token for a user, if there is one. Used before deleting the account. */
export async function revokeAppleAccess(
  options: AppleTokensOptions,
  accounts: { providerId: string; refreshToken?: string | null; idToken?: string | null }[],
) {
  const apple = accounts.find((account) => account.providerId === 'apple');
  if (!apple?.refreshToken || !options.key.keyId) return;
  // The token must be revoked for the same client (bundle ID) it was issued to.
  const clientId = audienceOf(apple.idToken) ?? options.bundleIds[0];
  if (!clientId) return;
  await revokeRefreshToken(options.key, clientId, apple.refreshToken);
}
