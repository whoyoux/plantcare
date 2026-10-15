import { zValidator } from '@hono/zod-validator';
import { createDb, eq, schema, sql, type Database } from '@plantcare/db';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { z } from 'zod';

import type { ApiEnv } from '../alchemy.run';
import { revokeAppleAuthorization } from './apple';
import { createAuth, type Auth } from './auth';
import { stageConfig } from './config';

type User = Auth['$Infer']['Session']['user'];

type AppEnv = {
  Bindings: ApiEnv;
  Variables: { db: Database; auth: Auth; user: User };
};

/** Rejects requests without a valid Better Auth session and exposes the signed-in user. */
const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  const session = await c.var.auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ code: 'UNAUTHORIZED' }, 401);
  c.set('user', session.user);
  await next();
});

const deleteAccountBody = z.object({
  /** For Apple-linked accounts: a fresh authorization code, so the server can revoke the Apple token. */
  authorizationCode: z.string().min(1).optional(),
  /** Bundle ID of the requesting app; the code is only valid for that client ID. */
  bundleId: z.string(),
});

const v1 = new Hono<AppEnv>()
  .use(requireUser)
  .get('/me', (c) => {
    const { id, name, email } = c.var.user;
    return c.json({ id, name, email });
  })
  .post('/account/delete', zValidator('json', deleteAccountBody), async (c) => {
    const { authorizationCode, bundleId } = c.req.valid('json');
    const userId = c.var.user.id;

    const accounts = await c.var.db.query.account.findMany({ where: { userId }, columns: { providerId: true } });
    if (accounts.some((account) => account.providerId === 'apple')) {
      const { bundleIds } = stageConfig(c.env.STAGE);
      if (!(bundleIds as readonly string[]).includes(bundleId)) return c.json({ code: 'INVALID_CLIENT' }, 400);
      if (!authorizationCode) return c.json({ code: 'APPLE_REAUTH_REQUIRED' }, 400);
      if (!c.env.APPLE_KEY_ID || !c.env.APPLE_PRIVATE_KEY) return c.json({ code: 'APPLE_KEY_NOT_CONFIGURED' }, 503);
      await revokeAppleAuthorization(
        { teamId: c.env.APPLE_TEAM_ID, keyId: c.env.APPLE_KEY_ID, privateKey: c.env.APPLE_PRIVATE_KEY },
        bundleId,
        authorizationCode,
      );
    }

    // Photos live under users/<id>/; R2 has no prefix delete, so list and delete in pages.
    let cursor: string | undefined;
    do {
      const page = await c.env.PHOTOS.list({ prefix: `users/${userId}/`, cursor });
      if (page.objects.length) await c.env.PHOTOS.delete(page.objects.map((object) => object.key));
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);

    // Sessions, accounts and identifications cascade.
    await c.var.db.delete(schema.user).where(eq(schema.user.id, userId));
    return c.body(null, 204);
  });

const app = new Hono<AppEnv>()
  // One DB client (and Better Auth instance) per request over Hyperdrive; closed after the response.
  .use(async (c, next) => {
    const db = createDb(c.env.HYPERDRIVE.connectionString);
    c.set('db', db);
    c.set('auth', createAuth(c.env, db));
    await next();
    c.executionCtx.waitUntil(db.$client.end());
  })
  .get('/health', async (c) => {
    await c.var.db.execute(sql`select 1`);
    return c.json({ status: 'ok', stage: c.env.STAGE });
  })
  .on(['GET', 'POST'], '/api/auth/*', (c) => c.var.auth.handler(c.req.raw))
  .route('/v1', v1);

export type AppType = typeof app;

export default app;
