import * as Alchemy from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';
import * as Neon from 'alchemy/Neon';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';

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
      // Neon's free plan caps point-in-time history at 6 h (Alchemy defaults to 24 h).
      historyRetentionSeconds: 21600,
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

/**
 * AI Gateway in front of OpenRouter: request logs, a gateway-wide request cap and a daily spend cap
 * as a backstop behind the per-user limits in the API.
 */
export const AiGateway = Effect.gen(function* () {
  const { stage } = yield* Alchemy.Stack;
  return yield* Cloudflare.AI.Gateway('AiGateway', {
    id: `plantcare-${stage}`,
    // The OpenRouter key travels with each request (Authorization header) and is never stored in the
    // gateway, so the gateway itself needs no token.
    authentication: false,
    collectLogs: true,
    logManagement: 10_000,
    logManagementStrategy: 'DELETE_OLDEST',
    rateLimitingInterval: 60,
    rateLimitingLimit: 120,
    rateLimitingTechnique: 'sliding',
  });
});

/** Burst limit for /v1/identify, keyed by user. */
export const IdentifyRateLimit = Cloudflare.RateLimit('IDENTIFY_RATE_LIMIT', {
  namespaceId: 1001,
  simple: { limit: 6, period: 60 },
});

/** Better Auth signing secret, minted once per stage and kept in Alchemy state. */
export const AuthSecret = Alchemy.Random('AuthSecret');

/** Signs the short-lived photo links handed to the app. */
export const PhotoUrlSecret = Alchemy.Random('PhotoUrlSecret');

const APPLE_TEAM_ID = '73SQTP34GN';

export const Api = Effect.gen(function* () {
  const { stage } = yield* Alchemy.Stack;
  const authSecret = yield* AuthSecret;
  const photoUrlSecret = yield* PhotoUrlSecret;
  const gateway = yield* AiGateway;
  return yield* Cloudflare.Worker('Api', {
    main: './src/index.ts',
    compatibility: { date: '2026-10-01', flags: ['nodejs_compat'] },
    domain: DOMAINS[stage],
    env: {
      HYPERDRIVE: Hyperdrive,
      PHOTOS: Photos,
      STAGE: stage,
      API_URL: `https://${DOMAINS[stage]}`,
      BETTER_AUTH_SECRET: authSecret.text,
      PHOTO_URL_SECRET: photoUrlSecret.text,
      // Sign in with Apple key (.p8), read from apps/api/.env at deploy time. Only needed to revoke
      // Apple tokens when an account is deleted; sign-in works without it.
      APPLE_TEAM_ID,
      APPLE_KEY_ID: Config.String('APPLE_KEY_ID').pipe(Config.withDefault('')),
      APPLE_PRIVATE_KEY: Config.Redacted('APPLE_PRIVATE_KEY').pipe(Config.withDefault(Redacted.make(''))),
      // Plant identification: OpenRouter through AI Gateway. The key comes from apps/api/.env.
      IDENTIFY_RATE_LIMIT: IdentifyRateLimit,
      AI_GATEWAY_ID: gateway.gatewayId,
      CLOUDFLARE_ACCOUNT_ID: gateway.accountId,
      OPENROUTER_API_KEY: Config.Redacted('OPENROUTER_API_KEY'),
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
