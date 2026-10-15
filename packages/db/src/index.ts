import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { relations } from './relations';
import * as schema from './schema';

export { relations, schema };
// Re-exported so consumers share this package's single drizzle-orm instance.
export { and, count, desc, eq, gte, sql } from 'drizzle-orm';

/**
 * Creates a Drizzle client for one request. On Workers, pass Hyperdrive's connection string;
 * Hyperdrive does the pooling, so keep the client small and skip prepared statements.
 */
export function createDb(connectionString: string) {
  const client = postgres(connectionString, { max: 5, fetch_types: false, prepare: false });
  return drizzle({ client, relations });
}

export type Database = ReturnType<typeof createDb>;

/** Better Auth database adapter over this package's schema. */
export function authAdapter(db: Database) {
  return drizzleAdapter(db, { provider: 'pg', schema });
}
