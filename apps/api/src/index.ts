import { createDb, type Database } from '@plantcare/db';
import { sql } from 'drizzle-orm';
import { Hono } from 'hono';

import type { ApiEnv } from '../alchemy.run';

type AppEnv = {
  Bindings: ApiEnv;
  Variables: { db: Database };
};

const app = new Hono<AppEnv>()
  // One DB client per request over Hyperdrive; closed after the response is sent.
  .use(async (c, next) => {
    const db = createDb(c.env.HYPERDRIVE.connectionString);
    c.set('db', db);
    await next();
    c.executionCtx.waitUntil(db.$client.end());
  })
  .get('/health', async (c) => {
    await c.var.db.execute(sql`select 1`);
    return c.json({ status: 'ok', stage: c.env.STAGE });
  });

export type AppType = typeof app;

export default app;
