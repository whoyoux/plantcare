import type { Database } from '@plantcare/db';
import { createFactory } from 'hono/factory';

import type { ApiEnv } from '../alchemy.run';
import type { Auth, AuthUser } from './auth/auth';
import type { PhotoUrls } from './services/photo-urls';
import type { Photos } from './services/photos';

/** Hono environment shared by the whole app: Worker bindings plus per-request variables. */
export type AppEnv = {
  Bindings: ApiEnv;
  Variables: {
    db: Database;
    auth: Auth;
    photos: Photos;
    photoUrls: PhotoUrls;
    /** Set by `requireUser` on protected routes. */
    user: AuthUser;
  };
};

export const factory = createFactory<AppEnv>();
