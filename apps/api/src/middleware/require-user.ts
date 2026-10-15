import { factory } from '../env';
import { AppError } from '../errors';

/** Rejects requests without a valid Better Auth session and exposes the signed-in user. */
export const requireUser = factory.createMiddleware(async (c, next) => {
  const session = await c.var.auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) throw new AppError('UNAUTHORIZED', 401);
  c.set('user', session.user);
  await next();
});
