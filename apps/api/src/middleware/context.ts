import { createDb } from '@plantcare/db';

import { createAuth } from '../auth/auth';
import { factory } from '../env';
import { createPhotoUrls } from '../services/photo-urls';
import { createPhotos } from '../services/photos';

/**
 * One DB client, Better Auth instance and set of services per request. Hyperdrive does the pooling; the client is
 * closed after the response is sent.
 */
export const requestContext = factory.createMiddleware(async (c, next) => {
  const db = createDb(c.env.HYPERDRIVE.connectionString);
  c.set('db', db);
  c.set('auth', createAuth(c.env, db));
  c.set('photos', createPhotos({ db, bucket: c.env.PHOTOS }));
  c.set('photoUrls', createPhotoUrls({ apiUrl: c.env.API_URL, secret: c.env.PHOTO_URL_SECRET }));
  await next();
  c.executionCtx.waitUntil(db.$client.end());
});
