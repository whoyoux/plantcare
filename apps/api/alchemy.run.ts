import * as Alchemy from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';
import * as Neon from 'alchemy/Neon';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

// Stages: `prod` and `dev`. Deploy `prod` first: it owns the Neon project the other stages branch from.
const MIGRATIONS = '../../packages/db/migrations';

const DOMAINS: Record<string, string> = {
  prod: 'api.plantcare.whxx.dev',
  dev: 'api-dev.plantcare.whxx.dev',
};

/**
 * `prod` owns the Neon project; its default branch `main` holds production data. Every other stage
 * references that project and gets its own branch named after the stage (e.g. `dev`).
 * Committed migrations from packages/db are applied on deploy.
 */
export const Database = Effect.gen(function* () {
  const { stage } = yield* Alchemy.Stack;

  if (stage === 'prod') {
    const project = yield* Neon.Project('Database', {
      name: 'plantcare',
      region: 'aws-eu-central-1',
      pgVersion: 18,
      defaultBranchName: 'main',
      databaseName: 'plantcare',
      migrations: MIGRATIONS,
    });
    return { origin: project.origin, pooledOrigin: project.pooledOrigin };
  }

  const project = yield* Neon.Project.ref('Database', { stage: 'prod' });
  const branch = yield* Neon.Branch('DatabaseBranch', { project, name: stage, migrations: MIGRATIONS });
  return { origin: branch.origin, pooledOrigin: branch.pooledOrigin };
});

/** Hyperdrive pools Neon's direct (non-pooled) endpoint; query caching stays off. */
export const Hyperdrive = Effect.gen(function* () {
  const database = yield* Database;
  return yield* Cloudflare.Hyperdrive.Connection('Hyperdrive', {
    origin: database.origin,
    // `alchemy dev` bypasses Hyperdrive and talks to Neon's pooler directly.
    dev: database.pooledOrigin,
    caching: { disabled: true },
  });
});

/** Uploaded plant photos; served to the app through signed URLs. */
export const Photos = Cloudflare.R2.Bucket('Photos');

export const Api = Effect.gen(function* () {
  const { stage } = yield* Alchemy.Stack;
  return yield* Cloudflare.Worker('Api', {
    main: './src/index.ts',
    compatibility: { date: '2026-10-01', flags: ['nodejs_compat'] },
    domain: DOMAINS[stage],
    env: {
      HYPERDRIVE: Hyperdrive,
      PHOTOS: Photos,
      STAGE: stage,
    },
  });
});

export type ApiEnv = Cloudflare.InferEnv<typeof Api>;

export default Alchemy.Stack(
  'PlantCare',
  {
    providers: Layer.mergeAll(Cloudflare.providers(), Neon.providers()),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const api = yield* Api;
    return { url: api.url.as<string>() };
  }),
);
