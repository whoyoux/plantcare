// Only used by `pnpm auth:schema` to generate src/schema/auth.ts with the Better Auth CLI.
// Keep its plugin list in sync with the real auth config in apps/api.
import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
  database: drizzleAdapter({}, { provider: 'pg' }),
  plugins: [expo()],
});
