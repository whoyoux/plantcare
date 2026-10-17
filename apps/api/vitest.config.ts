import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

/** Local Postgres for integration tests (`pnpm db:test` starts one in Docker; CI uses a service). */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:54329/plantcare_test';

export default defineConfig({
  test: {
    projects: [
      // Pure logic (services, Apple client), in Node.
      { test: { name: 'unit', include: ['src/**/*.test.ts'] } },
      // The whole Worker in the Workers runtime (Miniflare): routes, auth, R2, rate limits, Postgres.
      {
        plugins: [
          cloudflareTest({
            main: './src/index.ts',
            miniflare: {
              compatibilityDate: '2026-10-01',
              compatibilityFlags: ['nodejs_compat'],
              hyperdrives: { HYPERDRIVE: TEST_DATABASE_URL },
              r2Buckets: ['PHOTOS'],
              ratelimits: { IDENTIFY_RATE_LIMIT: { namespace_id: '1001', simple: { limit: 6, period: 60 } } },
              bindings: {
                STAGE: 'test',
                API_URL: 'http://api.test',
                BETTER_AUTH_SECRET: 'test-auth-secret-0123456789abcdef',
                PHOTO_URL_SECRET: 'test-photo-secret',
                APPLE_TEAM_ID: 'TEAM123',
                APPLE_KEY_ID: '',
                APPLE_PRIVATE_KEY: '',
                AI_GATEWAY_ID: 'plantcare-test',
                CLOUDFLARE_ACCOUNT_ID: 'account',
                OPENROUTER_API_KEY: 'test-openrouter-key',
              },
            },
          }),
        ],
        test: {
          name: 'integration',
          include: ['test/**/*.test.ts'],
          globalSetup: ['./test/global-setup.ts'],
          // One shared database: run files one after another.
          fileParallelism: false,
        },
      },
    ],
  },
});
