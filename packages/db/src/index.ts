import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { relations } from './relations';
import * as schema from './schema';

export { relations, schema };

/**
 * Creates a Drizzle client for one request. On Workers, pass Hyperdrive's connection string;
 * Hyperdrive does the pooling, so keep the client small and skip prepared statements.
 */
export function createDb(connectionString: string) {
  const client = postgres(connectionString, { max: 5, fetch_types: false, prepare: false });
  return drizzle({ client, relations });
}

export type Database = ReturnType<typeof createDb>;
