import type { ApiEnv } from '../alchemy.run';

declare global {
  namespace Cloudflare {
    // The test runtime gets the same bindings as the deployed Worker (see vitest.config.ts).
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- declaration merging
    interface Env extends ApiEnv {}
  }
}
