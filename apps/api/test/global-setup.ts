import { execFileSync } from 'node:child_process';

import { TEST_DATABASE_URL } from '../vitest.config';

/**
 * Fresh schema from the committed migrations before the integration run. Runs as a separate Node
 * process: this project resolves packages for workerd, and the migrator needs plain Node.
 */
export default function setup() {
  const script = new URL('../../../packages/db/scripts/reset-test-db.mjs', import.meta.url).pathname;
  execFileSync(process.execPath, [script, TEST_DATABASE_URL], { stdio: 'inherit' });
}
