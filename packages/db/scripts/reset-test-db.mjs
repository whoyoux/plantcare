// Drops everything and applies the committed migrations: a clean database for integration tests.
// Usage: node scripts/reset-test-db.mjs <postgres-url>. Never point it at a real database.
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.argv[2];
if (!url || !/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  throw new Error('reset-test-db only runs against a local database');
}

const client = postgres(url, { max: 1, onnotice: () => {} });
try {
  await client.unsafe(
    'drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;',
  );
  await migrate(drizzle({ client }), {
    migrationsFolder: new URL('../migrations', import.meta.url).pathname,
  });
} finally {
  await client.end();
}
