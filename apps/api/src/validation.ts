import { zValidator } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import type { z } from 'zod';

import { AppError } from './errors';

/** zValidator with our error format: invalid input becomes `{ code: 'INVALID_REQUEST' }`. */
export const validate = <Target extends keyof ValidationTargets, Schema extends z.ZodType>(
  target: Target,
  schema: Schema,
) =>
  zValidator(target, schema, (result) => {
    if (!result.success) throw new AppError('INVALID_REQUEST', 400);
  });
