import { factory } from '../../env';
import { AppError } from '../../errors';

const PREFIX = '/v1/photos/';

/**
 * Serves photos from the private bucket. No session needed: the link itself is the permission
 * (signed by the API, scoped to one object, expiring).
 */
export const photoRoutes = factory.createApp().get('/*', async (c) => {
  const key = decodeURIComponent(new URL(c.req.url).pathname.slice(PREFIX.length));
  const valid = await c.var.photoUrls.verify(key, c.req.query('expires'), c.req.query('signature'));
  if (!valid) throw new AppError('NOT_FOUND', 404);

  const object = await c.var.photos.get(key);
  if (!object) throw new AppError('NOT_FOUND', 404);
  return c.body(object.body, 200, {
    'Content-Type': object.httpMetadata?.contentType ?? 'image/jpeg',
    'Cache-Control': 'private, max-age=86400, immutable',
    ETag: object.httpEtag,
  });
});
