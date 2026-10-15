import { defineConfig } from 'drizzle-kit';

// Generation needs no credentials; Alchemy applies the committed migrations on deploy.
export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
});
