import { sql } from '@plantcare/db';

import { factory } from './env';
import { onError } from './errors';
import { identifyRoutes } from './features/identify/routes';
import { meRoutes } from './features/me/routes';
import { requestContext } from './middleware/context';

// Composition only: global middleware, auth, feature routes. Logic lives in features/ and services/.
const app = factory
  .createApp()
  .use(requestContext)
  .get('/health', async (c) => {
    await c.var.db.execute(sql`select 1`);
    return c.json({ status: 'ok', stage: c.env.STAGE });
  })
  // Better Auth: sign-in, session, sign-out, delete-user and the Apple token plugin.
  .on(['GET', 'POST'], '/api/auth/*', (c) => c.var.auth.handler(c.req.raw))
  .route('/v1/me', meRoutes)
  .route('/v1/identify', identifyRoutes);

app.onError(onError);
app.notFound((c) => c.json({ code: 'NOT_FOUND' }, 404));

export type AppType = typeof app;

export default app;
