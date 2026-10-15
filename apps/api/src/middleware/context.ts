import { createDb } from '@plantcare/db';

import { createAuth } from '../auth/auth';
import { factory } from '../env';

/**
 * One DB client and Better Auth instance per request. Hyperdrive does the pooling; the client is
 * closed after the response is sent.
 */
export const requestContext = factory.createMiddleware(async (c, next) => {
  const db = createDb(c.env.HYPERDRIVE.connectionString);
  c.set('db', db);
  c.set('auth', createAuth(c.env, db));
  await next();
  c.executionCtx.waitUntil(db.$client.end());
});
