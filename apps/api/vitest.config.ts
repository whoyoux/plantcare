import { defineConfig } from 'vitest/config';

// Unit tests for pure logic (services, Apple client). Worker integration tests come with
// @cloudflare/vitest-pool-workers.
export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
});
