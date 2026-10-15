import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * An expected failure with a stable, machine-readable code. The app translates codes into
 * messages, so responses never carry user-facing text.
 */
export class AppError extends Error {
  constructor(
    readonly code: string,
    readonly status: ContentfulStatusCode = 400,
  ) {
    super(code);
  }
}

/** Every error response has the shape `{ code }`. */
export const onError: ErrorHandler = (error, c) => {
  if (error instanceof AppError) return c.json({ code: error.code }, error.status);
  if (error instanceof HTTPException) return c.json({ code: 'HTTP_ERROR' }, error.status);
  console.error(error);
  return c.json({ code: 'INTERNAL_ERROR' }, 500);
};
