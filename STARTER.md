# Project starter: iOS-first Expo app + Cloudflare API + website

Everything learned building PlantCare (Oct 2026), distilled so the next project starts at "build the product", not "build the starter". Written for a coding agent and for me: rules are imperative, each with the reason, and the snippets are trimmed copies of code that runs in production.

**How to use it**

1. Copy this file into the new repo's root. Replace the placeholders: `<app>` (package scope and slug, e.g. `plantcare`), `<App>` (display name), `<domain>` (e.g. `whxx.dev`), `<bundle.id>` (e.g. `dev.whxx.plantcare`), `<TEAM_ID>` (Apple team).
2. Agent: read the whole file before scaffolding, then follow [Bootstrap order](#16-bootstrap-order). When a section says "check the docs", do it: Expo, Better Auth and Alchemy move fast and versions here are a snapshot.
3. Once the project exists, write its own short `AGENTS.md` from sections 1, 4 and 14 (that file is what agents load every session; this one is the long reference).

---

## Contents

1. [Principles](#1-principles)
2. [Stack](#2-stack)
3. [Repo layout](#3-repo-layout)
4. [Tooling: pnpm, Turborepo, TypeScript, ESLint, Prettier](#4-tooling)
5. [Backend: Hono on Cloudflare Workers](#5-backend-hono-on-cloudflare-workers)
6. [Database: Neon Postgres, Hyperdrive, Drizzle](#6-database-neon-postgres-hyperdrive-drizzle)
7. [Auth: Better Auth with native Apple and Google sign-in](#7-auth-better-auth-with-native-apple-and-google-sign-in)
8. [Infrastructure as code: Alchemy](#8-infrastructure-as-code-alchemy)
9. [Backend testing](#9-backend-testing)
10. [Mobile app: Expo](#10-mobile-app-expo)
11. [Mobile builds, TestFlight and over-the-air updates](#11-mobile-builds-testflight-and-over-the-air-updates)
12. [Website](#12-website)
13. [CI/CD](#13-cicd)
14. [Agent workflow and skills](#14-agent-workflow-and-skills)
15. [Security, abuse and cost baseline](#15-security-abuse-and-cost-baseline)
16. [Bootstrap order](#16-bootstrap-order)
17. [App Store launch checklist](#17-app-store-launch-checklist)
18. [Business notes (Poland)](#18-business-notes-poland)
19. [Gotchas log](#19-gotchas-log)

---

## 1. Principles

**Product**

- **Native-first on iOS.** Use the system's own components (native tabs, Liquid Glass buttons through `@expo/ui`, SF Symbols, context menus, form sheets, haptics) before custom UI. It looks right, gets accessibility for free and ages with iOS.
- **Every frame in both themes.** Design tokens with explicit light and dark values and checked contrast (text ≥ 4.5:1, filled controls with white labels ≥ 4.5:1). Check dark mode on a device, not just the simulator.
- **Polish and English from day one**, typed translation keys, no string concatenation.
- **Empty states are screens, not empty lists.** Render them outside the list so nothing scrolls and the tab bar doesn't minimise on an empty screen.
- **Say when AI did it.** Any AI output (identification, advice, safety info) carries a short, kind disclaimer where people read it, and the Terms say the same.

**Engineering**

- **Typed end to end.** Zod at the edges, Hono's `AppType` gives the app a typed client, Drizzle types the database. No hand-written API types.
- **Errors are codes, not messages.** The API answers `{ code: 'NOT_FOUND' }`; the app translates codes. No user-facing text on the server.
- **Small modules with one job**: `features/*/routes.ts` (HTTP), `services/*` (logic and I/O), `lib/*` in the app. Composition happens in one place (`index.ts`, root layout).
- **Comments explain why**, in full sentences, at the top of anything non-obvious. No comments that restate code.
- **Every query checks ownership** (`where userId = me`). Never trust an id from the client.
- **Infrastructure is code** (Alchemy). No click-ops except what an API can't do (listed where it applies).
- **Cost and abuse limits ship with the feature**, not after the first bill (section 15).
- **Verify before "done"**: lint, typecheck, format check, tests; for UI, look at it.

**Safety rules for agents** (keep these in the new project's `AGENTS.md`)

- Never download or run prebuilt binaries or self-updating launchers (some skills ship `scripts/` that fetch engines from GitHub releases). Install skills as Markdown only and strip executables. Package-manager installs of known tools are fine after naming them.
- Never start EAS cloud builds unless asked: the free quota is a few builds a month. Build locally (section 11).
- Never ask for keys, `.p8` files or passwords in chat. Say where the secret goes (GitHub environment, `.env`) and let the user paste it there.
- Production deploys and TestFlight uploads only when the user asked in that message.

---

## 2. Stack

Snapshot from October 2026. Check each one's current docs before pinning.

| Layer       | Choice                                                                               | Why                                                                 |
| ----------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Monorepo    | pnpm workspaces + catalog, Turborepo, Node 24                                        | One version of each shared dependency, cached tasks                 |
| Language    | TypeScript (strict, `noUncheckedIndexedAccess`)                                      | Expo pins the TS major; keep the whole repo on it                   |
| Mobile      | Expo SDK 58 (React Native 0.88, React 19.3, Hermes), Expo Router, dev client + CNG   | Native modules, file routes, no hand-edited `ios/`                  |
| Mobile UI   | Uniwind (Tailwind 4 for RN), `@expo/ui` SwiftUI components, expo-symbols, expo-image | Tokens + native controls                                            |
| Mobile data | TanStack Query 5, Hono `hc` client over `react-native-nitro-fetch`                   | Typed, cached, HTTP/2–3                                             |
| i18n        | i18next + react-i18next, `@formatjs/intl-pluralrules` polyfill                       | Hermes lacks `Intl.PluralRules`                                     |
| API         | Hono 4 on Cloudflare Workers                                                         | Tiny, typed RPC client, runs on the edge                            |
| Auth        | Better Auth 1.7 + `@better-auth/expo`                                                | Native ID-token sign-in, sessions in our DB                         |
| Database    | Neon Postgres 18 via Cloudflare Hyperdrive, Drizzle ORM                              | Serverless Postgres, pooled from Workers                            |
| Files       | Cloudflare R2 (private) + HMAC-signed URLs served by the API                         | No egress fees, no public bucket                                    |
| IaC         | Alchemy v2 (Effect-based)                                                            | Worker, R2, Hyperdrive, Neon, rate limits, migrations in one deploy |
| Website     | React Router 8 (pre-rendered), Tailwind 4, shadcn/ui, Worker static assets           | Legal pages + landing, zero runtime                                 |
| Tests       | Vitest 5, `@cloudflare/vitest-plugin` (Miniflare) + real Postgres in Docker          | Tests the real Worker                                               |
| CI/CD       | GitHub Actions: checks on every push, dev on `main`, prod on `v*` tags with approval |                                                                     |
| AI (if any) | OpenRouter called directly from the Worker                                           | One key, any model, credit limit on the key                         |

Things I tried and dropped: **Cloudflare AI Gateway** (duplicated OpenRouter's limits and its logs stored full requests, user photos included), **Better Auth's Stripe plugin for the iOS app** (Apple requires in-app purchase for digital subscriptions; see section 18), **cloud EAS builds** (quota).

---

## 3. Repo layout

```
.
├── AGENTS.md                 # short rules for agents (derived from this file)
├── README.md                 # what it is, stages, how to run, how to release
├── apps/
│   ├── api/                  # Hono Worker
│   │   ├── alchemy.run.ts    # infra for the API (Neon, Hyperdrive, R2, rate limits, Worker)
│   │   ├── src/
│   │   │   ├── index.ts      # composition only: middleware, auth handler, feature routes
│   │   │   ├── env.ts        # Hono env type + factory
│   │   │   ├── errors.ts     # AppError + onError ({ code })
│   │   │   ├── validation.ts # zod validator with our error format
│   │   │   ├── config.ts     # per-stage constants, limits, model choice
│   │   │   ├── auth/         # Better Auth instance + plugins
│   │   │   ├── middleware/   # request context, requireUser
│   │   │   ├── features/<name>/routes.ts
│   │   │   └── services/     # logic and I/O (storage, signed URLs, external APIs)
│   │   ├── test/             # integration tests (Worker + Postgres)
│   │   └── vitest.config.ts
│   ├── mobile/               # Expo app
│   │   ├── app.config.ts     # variants, plugins, entitlements
│   │   ├── eas.json
│   │   ├── src/
│   │   │   ├── app/          # routes only (Expo Router)
│   │   │   ├── components/   # shared UI; components/native/* = platform pairs
│   │   │   ├── lib/          # api client, query hooks, auth, helpers
│   │   │   ├── i18n/         # i18next setup + locales/{en,pl}.ts
│   │   │   ├── widgets/      # expo-widgets layouts
│   │   │   └── global.css    # Tailwind/Uniwind tokens (light + dark)
│   │   ├── locales/          # native strings (permission prompts) per language
│   │   └── scripts/          # icon generation etc.
│   └── web/                  # React Router site
├── packages/
│   ├── db/                   # Drizzle schema, migrations, createDb, auth adapter
│   ├── shared/               # zod schemas and constants used by API and app
│   ├── eslint-config/        # shared flat config for TS packages
│   └── tsconfig/             # base.json
├── tools/                    # one-off tooling (evals, scripts), not deployed
├── patches/                  # pnpm patches (document each in its commit)
└── .github/workflows/        # checks.yml, ci.yml, release.yml, deploy.yml
```

Rules: routes in `src/app` only; anything shared between API and app goes to `packages/shared` (zod schemas, enums, prompts), never copied. Packages export TypeScript source (`"exports": { ".": "./src/index.ts" }`); Metro, Workers and Node type-stripping all consume it without a build step.

---

## 4. Tooling

### pnpm workspace with a catalog

`pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
  - tools/*

allowBuilds: # pnpm 11 blocks install scripts unless listed
  esbuild: true
  unrs-resolver: true
  workerd: true

catalog:
  # One React for the whole repo: React Native pins an exact version, and a second copy
  # (pulled in through react-dom) ends up in the app's native build.
  react: 19.3.0
  react-dom: 19.3.0
  typescript: ~6.0.3 # whatever the Expo SDK pins
  zod: ^4.6.7
  # Alchemy v2 applies migrations only in drizzle-kit's v1 layout; keep both on its pinned RC.
  drizzle-orm: 1.0.0-rc.5-ab785fc
  drizzle-kit: 1.0.0-rc.5-ab785fc
  postgres: ^3.4.9
  better-auth: ^1.7.7
  hono: ^4.13.13
  eslint: ^9.39.0 # eslint-config-expo supports ESLint 9
  prettier: ^3.9.0
  vitest: ^5.0.4
  turbo: ^2.11.8

# Expo's web packages auto-install react-dom as a peer; pnpm would pick the newest one.
overrides:
  react: 'catalog:'
  react-dom: 'catalog:'
```

- Shared versions go in the catalog (`"zod": "catalog:"` in each package). Expo packages are added with `npx expo install` from `apps/mobile` so they match the SDK.
- pnpm's `minimumReleaseAge` blocks packages published in the last days. When a fresh Expo patch is needed, add it to `minimumReleaseAgeExclude` with the exact version and say why in the commit.
- Patch a dependency with `pnpm patch <pkg>@<version>` → `pnpm patch-commit`; it lands in `patches/` and `patchedDependencies`. Comment the patched code with the reason.

### Root `package.json`

```json
{
  "private": true,
  "packageManager": "pnpm@11.25.0",
  "engines": { "node": ">=24" },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "devDependencies": { "turbo": "catalog:", "typescript": "catalog:", "prettier": "catalog:" }
}
```

`.nvmrc`: `24`.

### `turbo.json`

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "typecheck": { "dependsOn": ["^typecheck", "^build:types"] },
    "test": { "dependsOn": ["^build"], "cache": false },
    "build:types": { "dependsOn": ["^build:types"], "outputs": ["dist/types/**"] }
  }
}
```

`build:types` exists so the app can import the API's `AppType` from emitted declarations (section 5) instead of type-checking Worker code against React Native's libs.

### TypeScript: `packages/tsconfig/base.json`

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true
  }
}
```

The app extends `expo/tsconfig.base` instead, with `"paths": { "@/*": ["./src/*"] }`.

### ESLint (flat config) and Prettier

- TS packages: `packages/eslint-config/base.js` = `@eslint/js` recommended + `typescript-eslint` **recommendedTypeChecked** with `projectService`, `consistent-type-imports` (inline), unused vars with `_` escape, `eslint-config-prettier` last, type checking disabled for plain `.js` config files, ignores for `dist`, `migrations`, `.alchemy`, `.wrangler`.
- App: `eslint-config-expo/flat` + the Hermes guard below + prettier.
- Web: the shared config with `react-router typegen` run before lint and typecheck.

```js
// apps/mobile/eslint.config.js (the part worth copying)
{
  // Hermes lacks these; using one crashes the app at runtime (Intl.PluralRules is polyfilled).
  files: ['src/**'],
  rules: {
    'no-restricted-properties': ['error',
      ...['RelativeTimeFormat', 'ListFormat', 'Segmenter', 'DisplayNames', 'DurationFormat'].map((property) => ({
        object: 'Intl', property,
        message: 'Not available in Hermes. Use translated strings and Intl.DateTimeFormat instead.',
      })),
    ],
  },
},
```

`.prettierrc.json`: `{ "singleQuote": true, "printWidth": 120, "trailingComma": "all" }`. `.prettierignore`: lockfile, `**/migrations/**`, `**/.expo/**`, `**/.alchemy/**`, `**/ios/**`, `**/android/**`, `**/*.icon/**`, `.claude/skills/**`, generated `*.d.ts` (uniwind types, expo-env), `**/dist/**`, `**/build/**`, `**/.react-router/**`.

`.gitignore` must cover: `.env`, `.env*.local`, `*.p8`, `*.p12`, `*.key`, `*.pem`, `*.mobileprovision`, `.alchemy/`, `.wrangler/`, `.turbo/`, `dist/`, `node_modules/`.

---

## 5. Backend: Hono on Cloudflare Workers

### Shape

`src/index.ts` is composition only:

```ts
const app = factory
  .createApp()
  // Public and cheap: no database, so flooding it can't wake or exhaust Postgres.
  .get('/health', (c) => c.json({ status: 'ok', stage: c.env.STAGE }))
  .use('/api/*', requestContext)
  .use('/v1/*', requestContext)
  .on(['GET', 'POST'], '/api/auth/*', (c) => c.var.auth.handler(c.req.raw))
  .route('/v1/me', meRoutes)
  .route('/v1/things', thingRoutes);

app.onError(onError);
app.notFound((c) => c.json({ code: 'NOT_FOUND' }, 404));

export type AppType = typeof app; // the mobile app's typed client is built from this
export default app;
```

Chain `.route()` calls on one expression; splitting them loses the RPC types.

### Env and factory (`src/env.ts`)

```ts
import { createFactory } from 'hono/factory';
import type { ApiEnv } from '../alchemy.run'; // bindings inferred from the infra code

export type AppEnv = {
  Bindings: ApiEnv;
  Variables: { db: Database; auth: Auth; photoUrls: PhotoUrls; user: AuthUser };
};
export const factory = createFactory<AppEnv>();
```

### Errors (`src/errors.ts`) and validation (`src/validation.ts`)

```ts
/** An expected failure with a stable, machine-readable code. The app translates codes. */
export class AppError extends Error {
  constructor(
    readonly code: string,
    readonly status: ContentfulStatusCode = 400,
  ) {
    super(code);
  }
}

/** Every error response has the shape `{ code }`. */
export const onError: ErrorHandler = (error, c) => {
  if (error instanceof AppError) return c.json({ code: error.code }, error.status);
  if (error instanceof HTTPException) return c.json({ code: 'HTTP_ERROR' }, error.status);
  console.error(error);
  return c.json({ code: 'INTERNAL_ERROR' }, 500);
};

/** zValidator with our error format: invalid input becomes `{ code: 'INVALID_REQUEST' }`. */
export const validate = <T extends keyof ValidationTargets, S extends z.ZodType>(target: T, schema: S) =>
  zValidator(target, schema, (result) => {
    if (!result.success) throw new AppError('INVALID_REQUEST', 400);
  });
```

### Per-request context and auth guard

On Workers, create the DB client, Better Auth and services **per request** (Hyperdrive gives each request a fresh connection string; module-level clients leak sockets across requests).

```ts
export const requestContext = factory.createMiddleware(async (c, next) => {
  const db = createDb(c.env.HYPERDRIVE.connectionString);
  c.set('db', db);
  c.set('auth', createAuth(c.env, db));
  c.set('photoUrls', createPhotoUrls({ apiUrl: c.env.API_URL, secret: c.env.PHOTO_URL_SECRET }));
  await next();
});

export const requireUser = factory.createMiddleware(async (c, next) => {
  const session = await c.var.auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) throw new AppError('UNAUTHORIZED', 401);
  c.set('user', session.user);
  await next();
});
```

### A feature route

```ts
const IdParam = z.object({ id: z.uuid() });

export const thingRoutes = factory
  .createApp()
  .use(requireUser)
  .get('/', async (c) => {
    const rows = await c.var.db.select().from(table).where(eq(table.userId, c.var.user.id));
    return c.json({ items: rows.map(toDto) }); // DTOs: ISO dates, signed URLs, no internal columns
  })
  .patch('/:id', validate('param', IdParam), validate('json', Patch), async (c) => {
    const [row] = await c.var.db
      .update(table)
      .set(c.req.valid('json'))
      .where(and(eq(table.id, c.req.valid('param').id), eq(table.userId, c.var.user.id))) // ownership
      .returning({ id: table.id });
    if (!row) throw new AppError('NOT_FOUND', 404); // same answer for "missing" and "not yours"
    return c.body(null, 204);
  });
```

Conventions:

- Lists: `{ items, nextCursor }` with a cursor on `(createdAt, id)`; fixed page size; search with `ilike` server side.
- Dates out as ISO strings; timestamps stored with millisecond precision (`new Date()`) so cursors compare exactly.
- Idempotent creates where it's natural (adding the same thing twice returns the existing id with 200).
- Raw `sql\`\``with a JS`Date`parameter fails on Workers: pass`date.toISOString()` and cast (`::timestamptz`), or use Drizzle's typed operators (`gte(col, date)`), which serialise correctly.
- Multipart uploads: check `Content-Length` before `parseBody()`, then per-file size and magic bytes (JPEG `FF D8 FF`). `parseBody({ all: true })` turns repeated fields into arrays.

### Emitting `AppType` for the app

`apps/api/tsconfig.types.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "dist/types",
    "rootDir": "."
  },
  "include": ["src", "alchemy.run.ts"]
}
```

`apps/api/package.json`: `"exports": { "./client": { "types": "./dist/types/src/index.d.ts" } }` and a `build:types` script. The app adds `"@<app>/api": "workspace:*"` as a devDependency and imports `type { AppType } from '@<app>/api/client'`.

### Files in R2 with signed URLs

Keep the bucket private. Store under a per-user prefix (`users/<userId>/<id>.jpg`); the database is the source of truth for what exists. The API hands out links that expire at the end of the next UTC day (stable URLs within a day so the app's image cache works) and serves them itself:

```ts
async sign(key: string, now = Date.now()) {
  const expires = Math.ceil(now / DAY_MS) * DAY_MS + DAY_MS;
  const signature = await hmac(secret, `${key}:${expires}`); // crypto.subtle HMAC-SHA256, hex
  return `${apiUrl}/v1/photos/${key}?${new URLSearchParams({ expires: String(expires), signature })}`;
}
// verify: reject missing/expired, compare in constant time, then bucket.get(key)
// respond with Cache-Control: private, max-age=86400, immutable and the object's ETag
```

Deleting an account deletes the user's objects (`bucket.delete` takes at most 1000 keys per call; chunk).

### Calling an AI model (if the app has one)

- OpenRouter's OpenAI-compatible `/chat/completions` straight from the Worker, `response_format: json_schema` with `strict: true` from a zod schema (`z.toJSONSchema(schema, { target: 'draft-7' })`), `provider: { require_parameters: true }`, low reasoning effort when it doesn't hurt accuracy.
- Validate the answer with the same zod schema; retry once on a schema mismatch, then fail with a code.
- The prompt lives in `packages/shared` next to the schema. Make the model write its reasoning field **first** (an `analysis` string) so the answer follows from the evidence.
- Keep a `tools/ai-eval` with a labelled dataset and a script that prints accuracy, latency and cost per model and prompt version. Change prompts only with numbers; write results to a `RESULTS.md`.
- Limits in section 15.

---

## 6. Database: Neon Postgres, Hyperdrive, Drizzle

### `packages/db/src/index.ts`

```ts
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { relations } from './relations';
import * as schema from './schema';

export { relations, schema };
// Re-exported so consumers share this package's single drizzle-orm instance.
export { and, asc, count, desc, eq, gte, ilike, lt, or, sql } from 'drizzle-orm';

/**
 * A Drizzle client for one request. On Workers, pass Hyperdrive's connection string; Hyperdrive
 * pools the real connections and caches prepared statements, so the client stays small and is not
 * closed explicitly.
 */
export function createDb(connectionString: string) {
  const client = postgres(connectionString, { max: 5, fetch_types: false });
  return drizzle({ client, relations });
}
export type Database = ReturnType<typeof createDb>;

export function authAdapter(db: Database) {
  return drizzleAdapter(db, { provider: 'pg', schema });
}
```

Do **not** add `prepare: false` and do **not** call `client.end()`: both produced "socket closed" errors behind Hyperdrive.

### Schema conventions

```ts
export const thing = pgTable(
  'thing',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }), // account deletion cascades
    name: text('name').notNull(),
    intervalDays: integer('interval_days').notNull(),
    enabled: boolean('enabled').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('thing_user_created_idx').on(table.userId, table.createdAt.desc()), // matches the list query
    check('thing_interval_range', sql`${table.intervalDays} between 1 and 60`),
  ],
);
```

- Singular snake_case table names, `uuid` ids (Better Auth's own tables use text ids), `timestamptz` everywhere, `onDelete: 'cascade'` from the user so deleting an account deletes everything.
- Index for each list/count query you actually run. Check constraints for ranges the API also validates.
- Better Auth's tables are generated into `src/schema/auth.ts` with its CLI (`auth generate --config scripts/auth-schema.config.ts --output src/schema/auth.ts`).
- Migrations: `drizzle-kit generate --name <what>` (no credentials needed), commit them; Alchemy applies them on deploy. Never edit an applied migration.
- Integration tests reset the test DB from the committed migrations (`drop schema public cascade; create schema public;` + Drizzle's migrator), with a guard that refuses anything but `localhost`.

---

## 7. Auth: Better Auth with native Apple and Google sign-in

The app signs in natively (Apple's sheet, Google's SDK) and sends the **ID token** to Better Auth; no web redirects, no client secrets on the server.

```ts
export function createAuth(env: ApiEnv, db: Database) {
  const { bundleIds, schemes } = stageConfig(env.STAGE); // prod vs dev bundle ids and URL schemes
  return betterAuth({
    baseURL: env.API_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: authAdapter(db),
    trustedOrigins: [...schemes, 'https://appleid.apple.com'], // e.g. '<app>://', '<app>-preview://'
    socialProviders: {
      // The ID token's audience is the app's bundle id (Apple) or the web client id (Google).
      apple: { clientId: [...bundleIds], audience: [...bundleIds], clientSecret: '' },
      google: { clientId: GOOGLE_WEB_CLIENT_ID, clientSecret: '' },
    },
    // Social-only sign-in has no password to re-check; let any session delete its account.
    session: { freshAge: 0 },
    user: {
      deleteUser: {
        enabled: true,
        beforeDelete: async (user) => {
          await revokeAppleAccess(/* stored refresh token */).catch(console.error); // never block deletion
          await deleteAllFilesFor(user.id);
        },
      },
    },
    // In-memory per isolate: a backstop only; the WAF rule (section 15) is the real limit.
    // Workers don't set NODE_ENV, so enable it explicitly and key it by the real client IP.
    rateLimit: { enabled: true, window: 60, max: 100 },
    advanced: { ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } },
    plugins: [expo(), appleTokens(apple)],
  });
}
```

- **Apple token revocation is required by App Review** when the account is deleted. Native sign-in only yields an ID token, so right after signing in the app posts Apple's one-time `authorizationCode` to a small Better Auth plugin endpoint, which exchanges it (client secret = ES256 JWT signed with the Sign in with Apple `.p8` key, via `jose`) and stores the refresh token on the account row. On delete, revoke it at `https://appleid.apple.com/auth/revoke`.
- Apple sends the user's name only on the first authorization and never inside the token: pass `credential.fullName` along on sign-in.
- Use a nonce: hash it (SHA-256) for Apple, send the raw nonce to Better Auth.
- Google on iOS needs an iOS OAuth client per bundle id (its reversed client id becomes a URL scheme via the Google Sign-In config plugin) plus the web client id as the token audience.
- One Apple Services setup per team: Sign in with Apple enabled on each bundle id; the `.p8` key id and team id as Worker secrets.

App side:

```ts
export const authClient = createAuthClient({
  baseURL: env.apiUrl,
  plugins: [
    expoClient({
      scheme: env.scheme,
      storagePrefix: env.scheme, // separate keychain entries per app variant
      storage: SecureStore,
    }),
  ],
});
```

Root layout gates routes with `Stack.Protected` and keeps the splash screen up until the session is known, so signed-in users never flash the sign-in screen:

```tsx
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { data: session, isPending } = authClient.useSession();
  useEffect(() => {
    if (!isPending) void SplashScreen.hideAsync();
  }, [isPending]);
  if (isPending) return null;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen
          name="result"
          options={{ presentation: 'formSheet', sheetAllowedDetents: [0.6, 1], sheetGrabberVisible: true }}
        />
      </Stack.Protected>
      {/* After signing in, land on `/`, not the first tab folder alphabetically. */}
      <Stack.Protected guard={!session} redirectTo="/">
        <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  );
}
```

---

## 8. Infrastructure as code: Alchemy

Two stages: `prod` and `dev` (add PR stages later if needed). `prod` owns the Neon project; other stages get a Neon branch of it. Deploy `prod` first.

```ts
// apps/api/alchemy.run.ts (trimmed)
const MIGRATIONS = '../../packages/db/migrations';
const DOMAINS: Record<string, string> = { prod: 'api.<app>.<domain>', dev: 'api-dev.<app>.<domain>' };

export const Database = Effect.gen(function* () {
  const { stage } = yield* Alchemy.Stack;
  if (stage === 'prod') {
    const project = yield* Neon.Project('Database', {
      name: '<app>',
      region: 'aws-eu-central-1',
      pgVersion: 18,
      defaultBranchName: 'main',
      databaseName: '<app>',
      historyRetentionSeconds: 21600, // Neon's free plan caps point-in-time history at 6 h
      migrations: MIGRATIONS,
    });
    return { origin: project.origin, pooledOrigin: project.pooledOrigin };
  }
  const project = yield* Neon.Project.ref('Database', { stage: 'prod' });
  const branch = yield* Neon.Branch('DatabaseBranch', { project, name: stage, migrations: MIGRATIONS });
  return { origin: branch.origin, pooledOrigin: branch.pooledOrigin };
});

/** Hyperdrive pools Neon's direct (non-pooled) endpoint; query caching off. */
export const Hyperdrive = Effect.gen(function* () {
  const database = yield* Database;
  return yield* Cloudflare.Hyperdrive.Connection('Hyperdrive', {
    origin: database.origin,
    dev: database.pooledOrigin, // `alchemy dev` talks to Neon's pooler directly
    caching: { disabled: true },
  });
});

export const Files = Cloudflare.R2.Bucket('Files');
export const UserRateLimit = Cloudflare.RateLimit('USER_RATE_LIMIT', {
  namespaceId: 1001,
  simple: { limit: 6, period: 60 },
});
export const AuthSecret = Alchemy.Random('AuthSecret'); // minted once per stage, kept in state
export const UrlSecret = Alchemy.Random('UrlSecret');

export const Api = Effect.gen(function* () {
  const { stage } = yield* Alchemy.Stack;
  return yield* Cloudflare.Worker('Api', {
    main: './src/index.ts',
    compatibility: { date: '2026-10-01', flags: ['nodejs_compat'] },
    domain: DOMAINS[stage],
    env: {
      HYPERDRIVE: Hyperdrive,
      FILES: Files,
      USER_RATE_LIMIT: UserRateLimit,
      STAGE: stage,
      API_URL: `https://${DOMAINS[stage]}`,
      BETTER_AUTH_SECRET: (yield* AuthSecret).text,
      URL_SECRET: (yield* UrlSecret).text,
      // From apps/api/.env locally, from the GitHub environment in CI.
      OPENROUTER_API_KEY: Config.Redacted('OPENROUTER_API_KEY'),
      APPLE_PRIVATE_KEY: Config.Redacted('APPLE_PRIVATE_KEY').pipe(Config.withDefault(Redacted.make(''))),
    },
  });
});

export type ApiEnv = Cloudflare.InferEnv<typeof Api>;

export default Alchemy.Stack(
  '<App>',
  {
    providers: Layer.mergeAll(Cloudflare.providers(), Neon.providers()),
    state: Cloudflare.state(), // state lives in Cloudflare, so CI and laptop share it
  },
  Effect.gen(function* () {
    return { url: (yield* Api).url.as<string>() };
  }),
);
```

- Every secret the Worker reads must also be listed in the deploy workflow's `env:` (I forgot once and the deploy silently no-op'd the change).
- Removing a resource from the file deletes it on the next deploy (that's how an unused gateway and its logs disappeared). Read the deploy plan.
- Zone-level things (WAF rules) are shared by every site on the domain; manage them in the dashboard unless the zone is dedicated to this project.
- Website: `Cloudflare.Website.StaticSite('Website', { command: 'pnpm build', outdir: 'build/client', domain, assets: { htmlHandling: 'auto-trailing-slash', notFoundHandling: '404-page' } })` in its own `alchemy.run.ts`.

---

## 9. Backend testing

Two Vitest projects in `apps/api/vitest.config.ts`:

```ts
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:54329/<app>_test';

export default defineConfig({
  test: {
    projects: [
      { test: { name: 'unit', include: ['src/**/*.test.ts'] } }, // pure logic, Node
      {
        plugins: [
          cloudflareTest({
            main: './src/index.ts',
            miniflare: {
              compatibilityDate: '2026-10-01',
              compatibilityFlags: ['nodejs_compat'],
              hyperdrives: { HYPERDRIVE: TEST_DATABASE_URL },
              r2Buckets: ['FILES'],
              ratelimits: { USER_RATE_LIMIT: { namespace_id: '1001', simple: { limit: 6, period: 60 } } },
              bindings: {
                STAGE: 'test',
                API_URL: 'http://api.test',
                BETTER_AUTH_SECRET: 'test-secret-0123456789abcdef' /* … */,
              },
            },
          }),
        ],
        test: {
          name: 'integration',
          include: ['test/**/*.test.ts'],
          globalSetup: ['./test/global-setup.ts'], // resets the DB from committed migrations (plain Node process)
          fileParallelism: false, // one shared database
        },
      },
    ],
  },
});
```

- Postgres for tests: `docker run --rm -d --name <app>-test-db -p 54329:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=<app>_test postgres:18-alpine` (a `db:test` script). CI runs the same image as a service on the same port.
- A signed-in user without going through Apple: insert `user` + `session` rows and send Better Auth's signed cookie:

```ts
async function signedCookie(token: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.BETTER_AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(token));
  return encodeURIComponent(`${token}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`);
}
// cookie: `better-auth.session_token=${await signedCookie(token)}`; requests via SELF.fetch('http://api.test/...')
```

- Mock outbound calls (AI, Apple) by spying on `globalThis.fetch` and matching the URL; let everything else through.
- Test what matters: auth required, ownership (another user's id → 404), validation codes, limits (burst and daily), cascade on account deletion, and that nothing is stored on failure paths.

---

## 10. Mobile app: Expo

Before touching any Expo API: read the SDK major in `package.json` and fetch `https://docs.expo.dev/versions/v<major>.0.0/` and `https://docs.expo.dev/llms.txt`. Expo changes every SDK; memory is wrong.

### App variants (`app.config.ts`)

One codebase, three installable apps side by side: `development` (dev client), `preview` (TestFlight, talks to the dev API) and `production` (App Store, prod API).

```ts
const VARIANTS = {
  production: { name: '<App>', bundleIdentifier: '<bundle.id>', scheme: '<app>', apiUrl: 'https://api.<app>.<domain>' },
  preview: {
    name: '<App> Preview',
    bundleIdentifier: '<bundle.id>.preview',
    scheme: '<app>-preview',
    apiUrl: 'https://api-dev.<app>.<domain>',
  },
  development: {
    name: '<App> Dev',
    bundleIdentifier: '<bundle.id>.dev',
    scheme: '<app>-dev',
    apiUrl: 'https://api-dev.<app>.<domain>',
  },
} as const;

function resolveVariant(value: string | undefined) {
  // Default to production so a build without APP_VARIANT never ships a dev identity.
  if (!value) return 'production';
  if (value in VARIANTS) return value as keyof typeof VARIANTS;
  throw new Error(`Unknown APP_VARIANT "${value}"`);
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name,
  slug: '<app>',
  owner: '<expo-account>',
  version: '1.0.0',
  scheme,
  userInterfaceStyle: 'automatic',
  runtimeVersion: { policy: 'fingerprint' },
  updates: { url: `https://u.expo.dev/${EAS_PROJECT_ID}` },
  ios: {
    bundleIdentifier,
    appleTeamId: '<TEAM_ID>',
    icon: `./assets/icons/${variant}.icon`,
    supportsTablet: false,
    usesAppleSignIn: true,
    config: { usesNonExemptEncryption: false }, // skips the export-compliance question per build
    infoPlist: { CFBundleAllowMixedLocalizations: true },
    entitlements: { 'com.apple.security.application-groups': [`group.${bundleIdentifier}`] }, // widgets
  },
  locales: { en: './locales/en.json', pl: './locales/pl.json' }, // native permission strings
  plugins: [
    'expo-router',
    ['expo-build-properties', { ios: { deploymentTarget: '17.0' } }],
    'expo-apple-authentication',
    'expo-secure-store',
    ['expo-localization', { supportedLocales: ['en', 'pl'] }], // per-app language in iOS Settings
    ['expo-notifications', { enableRemoteNotifications: false }], // local only: no APNs entitlement
    // camera/image-picker with explicit permission strings and microphone off
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: { appVariant: variant, apiUrl, eas: { projectId: EAS_PROJECT_ID } },
});
```

Read config at runtime through one validated module:

```ts
// src/lib/env.ts
export const env = z.object({ apiUrl: z.url(), scheme: z.string().min(1), bundleId: z.string().min(1) }).parse({
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? Constants.expoConfig?.extra?.apiUrl, // override for a local API
  scheme: Constants.expoConfig?.scheme,
  bundleId: Constants.expoConfig?.ios?.bundleIdentifier,
});
```

Icons: generate all variants (iOS `.icon` bundles for Liquid Glass, PNGs, Android foregrounds, splash, website logo/favicon) from one source with a `scripts/generate-icons.mjs` (sharp). Non-production icons carry a DEV/PREVIEW banner so the three apps are distinguishable.

### Routing (Expo Router)

```
src/app/
  _layout.tsx               # providers, Stack.Protected, modals/sheets
  sign-in.tsx
  camera.tsx                # fullScreenModal
  result.tsx                # formSheet with detents
  (tabs)/_layout.tsx        # NativeTabs + app-wide sync hooks (reminders, widget, quick actions)
  (tabs)/(home)/_layout.tsx # a Stack per tab (large titles)
  (tabs)/(home)/index.tsx
  (tabs)/(settings)/settings.tsx
```

- **Native tabs** (`expo-router/native-tabs`): real `UITabBar` with Liquid Glass, SF Symbols per state, `minimizeBehavior="onScrollDown"`, tint from the accent token.
- **One Stack per tab** with shared large-title options:

```ts
export const largeTitleScreenOptions = {
  headerLargeTitleEnabled: true,
  headerTransparent: true,
  headerShadowVisible: false,
  headerLargeTitleShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
} satisfies ScreenOptions;
```

- Scroll views on those screens need `contentInsetAdjustmentBehavior="automatic"`.
- **Long-press menus and previews**: `Link` with `Link.Trigger` + `Link.Menu`/`Link.MenuAction` (real `UIContextMenu`, haptics included). Swipe actions: `ReanimatedSwipeable` from react-native-gesture-handler.
- Pass params as strings; for arrays use `JSON.stringify`. Typed routes regenerate when `expo start` runs; a new route file is a type error until then.

### Styling: Uniwind tokens

`src/global.css`:

```css
@import 'tailwindcss';
@import 'uniwind';

/* Contrast: text pairs ≥ 5:1 in both themes; dark surfaces follow iOS grouped backgrounds. */
@layer theme {
  :root {
    @variant light {
      --color-background: #f2f5f1;
      --color-card: #ffffff;
      --color-foreground: #14201a;
      --color-muted: #5a675f;
      --color-separator: #cfd9d2;
      --color-accent: #2a7148; /* text and icons */
      --color-accent-fill: #2a7148; /* filled controls with white labels */
      --color-accent-soft: #e3f0e7; /* tinted backgrounds */
      --color-danger: #c4311f;
      --color-warning: #95560a;
    }
    @variant dark {
      --color-background: #050806;
      --color-card: #1a221d;
      --color-foreground: #eef3ef;
      --color-muted: #9aa7a0;
      --color-separator: #36423b;
      --color-accent: #74d19a;
      --color-accent-fill: #287d4d; /* a light accent fails with a white label (1.85:1) */
      --color-accent-soft: #21402c;
      --color-danger: #ff7a66;
      --color-warning: #f0b04a;
    }
  }
}

@theme {
  --font-rounded: ui-rounded; /* SF Pro Rounded for titles */
  --font-latin: ui-serif; /* New York for secondary names */
}
```

- Use semantic classes (`bg-card`, `text-muted`, `bg-accent-fill`) only; no raw hex in components. Read a token in JS with `useCSSVariable('--color-accent')` (for native views and SF Symbol tints).
- Keep separate tokens for "accent as text" and "accent as fill": one value can't pass contrast in both roles in dark mode.
- Don't rely on opacity modifiers on custom tokens (`bg-danger/15`); add a token instead.
- `metro.config.js`: `withUniwindConfig(config, { cssEntryFile: './src/global.css', dtsFile: './src/uniwind-types.d.ts' })` as the outermost wrapper, and block `.env*` files from Metro's watcher (they would leak into transform errors). Restore the generated `uniwind-types.d.ts` if a build rewrites it.

### Native components with a fallback

Platform pairs in `src/components/native/`: `button.ios.tsx` (SwiftUI via `@expo/ui`), `button.tsx` (Pressable fallback), `button.types.ts` (shared props). Metro picks the `.ios.tsx` file on iOS.

```tsx
// button.ios.tsx
export function Button({
  label,
  onPress,
  systemImage,
  variant = 'prominent',
  tone = 'accent',
  disabled: isDisabled = false,
}: ButtonProps) {
  const fill = useCSSVariable('--color-accent-fill');
  const accent = useCSSVariable('--color-accent');
  const danger = useCSSVariable('--color-danger');
  const color = variant === 'prominent' ? fill : tone === 'danger' ? danger : accent;
  return (
    <Host matchContents={{ vertical: true }}>
      <SwiftUIButton
        onPress={onPress}
        modifiers={[
          buttonStyle(variant === 'prominent' ? 'glassProminent' : 'glass'),
          controlSize('large'),
          ...(typeof color === 'string' ? [tint(color)] : []),
          disabled(isDisabled),
        ]}
      >
        {/* The frame goes on the label so the glass background spans the full width. */}
        <Label title={label} systemImage={systemImage} modifiers={[frame({ maxWidth: Number.POSITIVE_INFINITY })]} />
      </SwiftUIButton>
    </Host>
  );
}
```

Same pattern for an empty state (`ContentUnavailableView`) and grouped forms (`Form`/`Section`/`Picker` in settings). Destructive actions use a real danger button, not red text.

### Data: typed client + TanStack Query

```ts
// src/lib/api.ts
export const api = hc<AppType>(env.apiUrl, {
  fetch: nitroFetch, // native URLSession, HTTP/2–3
  headers: async (): Promise<Record<string, string>> => {
    const cookie = await authClient.getCookie();
    return cookie ? { Cookie: cookie } : {};
  },
  init: { credentials: 'omit' },
});

/** Error with the API's `code` (translated in the app, never shown raw). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
  ) {
    super(code ?? `HTTP ${status}`);
  }
}

export async function ensureOk<T extends { ok: boolean; status: number; json(): Promise<unknown> }>(response: T) {
  if (response.ok) return response;
  const body = (await response.json().catch(() => null)) as { code?: string } | null;
  throw new ApiError(response.status, body?.code);
}
```

```ts
// src/lib/query-client.ts: React Native has no window focus/online events
export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });
onlineManager.setEventListener((setOnline) => {
  const sub = Network.addNetworkStateListener((s) => setOnline(Boolean(s.isConnected)));
  return () => sub.remove();
});
focusManager.setEventListener((setFocused) => {
  const sub = AppState.addEventListener('change', (status) => setFocused(status === 'active'));
  return () => sub.remove();
});
```

Hooks per feature in `src/lib/<feature>.ts` with a key factory and types inferred from the API:

```ts
export type Item = InferResponseType<typeof api.v1.things.$get, 200>['items'][number];
export const thingKeys = { all: ['things'] as const, detail: (id: string) => ['things', 'detail', id] as const };

export function useThings() {
  return useQuery({
    queryKey: thingKeys.all,
    queryFn: async () => (await ensureOk(await api.v1.things.$get())).json(),
  });
}
// mutations invalidate the feature's root key; infinite lists use useInfiniteQuery with nextCursor
```

Multipart uploads go through `nitroFetch` with `FormData` (`{ uri, type, name }` objects) and the session cookie, not through `hc`. Re-encode photos with `expo-image-manipulator` (resize to ~1024 px, JPEG 0.8) before upload: smaller and it strips EXIF location.

### i18n

```ts
// src/i18n/index.ts
// Hermes has no Intl.PluralRules, which i18next needs for "1 dzień / 2 dni / 5 dni".
import '@formatjs/intl-pluralrules/polyfill.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import '@formatjs/intl-pluralrules/locale-data/pl.js';

const i18n = createInstance();
void i18n
  .use(initReactI18next)
  .init({ resources, lng: deviceLanguage(), fallbackLng: 'en', interpolation: { escapeValue: false } });
```

- Locales as TS objects (`locales/en.ts`, `locales/pl.ts`); English is the source of truth for keys, typed via `declare module 'i18next' { interface CustomTypeOptions { resources: { translation: typeof en } } }`. Polish files may add `_few`/`_many` plural keys (a `Translations<T>` helper type allows extra plural suffixes).
- iOS restarts the app when its language changes, so reading the device language once at startup is enough; expo-localization's `supportedLocales` adds the per-app language picker in Settings.
- Dates: `Intl.DateTimeFormat` only. Relative dates ("2 days ago") come from translated strings, not `Intl.RelativeTimeFormat` (crashes on Hermes; the ESLint guard catches it).

### Small app-wide patterns worth copying

- **Haptics with meaning**: one `src/lib/haptics.ts` exposing `tap`, `toggle(on)`, `threshold`, `success`, `warning`, `error`, mapped to `expo-haptics` on iOS and `performAndroidHapticsAsync` on Android. Use them for moments that matter (result arrived, item added, swipe crossed the delete threshold, destructive confirm). Native tabs, context menus, alerts and the share sheet already have their own. iOS mutes haptics while the camera runs and in Low Power Mode.
- **Camera on request**: a home card opens a full-screen camera; never run the camera just because the app opened (privacy indicator, battery, muted haptics). Ask for permission on first open, not at launch.
- **Dev preferences** (theme, language overrides) in a small JSON file with synchronous `expo-file-system` IO so they apply before the first render; ignored in production builds.
- **Local notifications** for reminders, scheduled by the app (`expo-notifications`, no push, no tokens); opt-in per item, and permission requested only when the user turns one on.
- **Share**: `Share.share({ message, url })` with a locally cached copy of the image (signed links expire).
- **Home screen widget** (`expo-widgets`): a pure function component with the `'widget'` directive, only `@expo/ui/swift-ui` components, no hooks, no outside values (inline colours, pass everything as props). The app writes a timeline (now + the next 7 midnights) whenever the data changes or the app becomes active; `widgetURL` deep-links into the app.
- **Quick actions** (`expo-quick-actions`): set items from JS so titles follow the app language; route with `useQuickActionRouting()` in a layout below the root. Under SDK 58's UIScene lifecycle the cold-start action was lost; patch noted in the gotchas log.
- **Accessibility**: `accessibilityRole` and `accessibilityLabel` on every custom pressable; Dynamic Type friendly sizes; colour never the only signal (a label next to every coloured level).

---

## 11. Mobile builds, TestFlight and over-the-air updates

### `eas.json`

```json
{
  "cli": { "version": ">= 24.14.0", "appVersionSource": "remote" },
  "build": {
    "base": { "node": "24.22.0", "pnpm": "11.25.0" },
    "development": {
      "extends": "base",
      "developmentClient": true,
      "distribution": "internal",
      "environment": "development",
      "env": { "APP_VARIANT": "development" }
    },
    "development-simulator": { "extends": "development", "ios": { "simulator": true } },
    "preview": {
      "extends": "base",
      "channel": "preview",
      "environment": "preview",
      "autoIncrement": true,
      "env": { "APP_VARIANT": "preview" }
    },
    "production": {
      "extends": "base",
      "channel": "production",
      "environment": "production",
      "autoIncrement": true,
      "env": { "APP_VARIANT": "production" }
    }
  },
  "submit": {
    "preview": { "ios": { "appleTeamId": "<TEAM_ID>", "ascAppId": "<preview ASC app id>" } },
    "production": { "ios": { "appleTeamId": "<TEAM_ID>" } }
  }
}
```

### Build locally, submit to TestFlight

```json
"build:preview:local": "EAS_LOCAL_BUILD_WORKINGDIR=$HOME/.cache/eas-local-build eas build --platform ios --profile preview --local --output build/<app>-preview.ipa && APP_VARIANT=preview eas submit --platform ios --profile preview --path build/<app>-preview.ipa",
"build:prod:local": "EAS_LOCAL_BUILD_WORKINGDIR=$HOME/.cache/eas-local-build eas build --platform ios --profile production --local --output build/<app>-production.ipa && APP_VARIANT=production eas submit --platform ios --profile production --path build/<app>-production.ipa",
"update:preview": "APP_VARIANT=preview eas update --channel preview --environment preview",
"update:prod": "APP_VARIANT=production eas update --channel production --environment production"
```

- Signing credentials and build numbers still come from EAS (remote), so local builds use no quota.
- Needs Xcode, CocoaPods (keep it current with `brew upgrade cocoapods` after Ruby changes), fastlane, and `LANG=en_US.UTF-8`.
- `APP_VARIANT` must be set for `eas submit` too, or it reads the production bundle id.
- `EAS_LOCAL_BUILD_WORKINGDIR` outside `/var/folders` (see gotchas).
- Any new app extension (widget, etc.) is a new bundle id: tick its capabilities (e.g. App Groups with `group.<bundle id>`) by hand in the Apple Developer portal, then create its provisioning profile once with an interactive `APP_VARIANT=<variant> eas credentials --platform ios`. Non-interactive builds can't do either.
- Run long builds in the background and keep the Mac awake (`caffeinate -dims` while it runs; stop it afterwards).

### Over-the-air updates and App Review

Apple allows downloaded JavaScript only if it doesn't add or change features (Guidelines 2.5.2, 2.5.19; since 16 Oct 2026 adding features after review can end the developer account).

- **OK over the air**: bug and crash fixes, copy and translation fixes, small visual fixes on existing screens, performance.
- **New build + review**: any new screen, flow or capability, changed behaviour of an existing feature, anything native.
- **Never**: feature flags or remote config that turn on functionality review didn't see.
- Server-side changes (API, prompts, model, limits) are fine while the app's features stay the same.

Runtime versions use the `fingerprint` policy. To hotfix a build whose runtime differs from `main`, publish from a branch at that build's commit (or temporarily set `runtimeVersion` to the build's resolved string, publish to the channel, restore the file).

---

## 12. Website

React Router 8 in framework mode, fully pre-rendered (`ssr: false, prerender: true`), deployed as Worker static assets. Its jobs: landing page, privacy policy, terms, support page (App Store needs the URLs), and a home for the launch video.

```ts
// app/routes.ts: Polish at the root, English under /en; same modules, separate ids per language
const pages = (lang: 'pl' | 'en') => [
  index('routes/home.tsx', { id: `${lang}-home` }),
  route('privacy', 'routes/privacy.tsx', { id: `${lang}-privacy` }),
  route('terms', 'routes/terms.tsx', { id: `${lang}-terms` }),
  route('support', 'routes/support.tsx', { id: `${lang}-support` }),
];
export default [
  ...pages('pl'),
  ...prefix('en', pages('en')),
  route('404', 'routes/not-found.tsx'),
] satisfies RouteConfig;
```

- `build` script copies the pre-rendered `build/client/404/index.html` to `404.html` for Cloudflare's 404 handling.
- Legal text lives as data (`content/legal.ts`: `{ title, description, intro, sections: [{ heading, blocks }] }`) rendered by one `LegalPage` component, written from what the code actually does (which data, where stored, which processors, retention, deletion, AI use, local notifications). Facts like controller name, contact email and AI provider come from one `site.ts`; keep a `legalUpdated` date and bump it with every change.
- Tailwind 4 via `@tailwindcss/vite`, shadcn/ui components, `@fontsource-variable/*` fonts (self-hosted, no Google requests), `lucide-react` icons.
- Video: MP4 + WebP poster per language and orientation; pick vertical on narrow screens with `matchMedia('(max-width: 767px)')`.

---

## 13. CI/CD

Four workflows:

- **`checks.yml`** (reusable, `workflow_call`): Postgres 18 service on port 54329 with a health check; `pnpm install --frozen-lockfile`, `format:check`, `lint`, `typecheck`, `test`. Node 24 with the pnpm cache.
- **`ci.yml`**: on push to `main` and on PRs, `concurrency: ci-${{ github.ref }}` with cancel-in-progress; runs checks; on `main` deploys `dev` when the repo variable `DEPLOY_ENABLED == 'true'` (lets the repo exist before secrets do).
- **`release.yml`**: on tags `v*`; runs checks on the tagged commit, then deploys `prod`.
- **`deploy.yml`** (reusable, input `stage`): `environment: ${{ inputs.stage }}` (secrets per GitHub environment, and the `prod` environment has **required reviewers**, so every prod deploy waits for an approval click), `concurrency: deploy-<stage>` without cancel; deploys the API (`pnpm exec alchemy deploy --stage <stage> --yes --no-input` in `apps/api`), builds and deploys the website.

Secrets (per environment `dev` and `prod`): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `NEON_API_KEY` (org key), service keys (`OPENROUTER_API_KEY`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`). Every one is also listed in `deploy.yml`'s `env:`.

Release: `git tag v0.x.y && git push origin v0.x.y`, approve in GitHub, then check `/health` (stage) and an authenticated endpoint returning 401 without a session.

Mobile builds never run in CI (quota); they run on the Mac (section 11).

---

## 14. Agent workflow and skills

### Skills (`.claude/skills`, tracked in `skills-lock.json`)

| Skill                                                   | Source                            | Use it for                                                                                        |
| ------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------- |
| expo-router, expo-data-fetching, expo-project-structure | `expo/skills`                     | Routes, native tabs, sheets, menus; data fetching; layout of a new app                            |
| expo plugin (`expo@claude-plugins-official`)            | Claude plugins                    | Expo docs-aware helpers (enable in `.claude/settings.json`)                                       |
| vercel-react-native-skills                              | `vercel-labs/agent-skills`        | RN/Expo best practices, lists, animations                                                         |
| react-native-best-practices                             | `callstackincubator/agent-skills` | Performance: FPS, TTI, re-renders, Hermes                                                         |
| hono                                                    | `honojs/skills`                   | Hono APIs, middleware, testing, CLI                                                               |
| cloudflare                                              | `cloudflare/skills`               | Choosing Cloudflare products                                                                      |
| react-router                                            | —                                 | Website routes, pre-rendering                                                                     |
| frontend-design                                         | `anthropics/skills`               | Deliberate visual direction for new UI                                                            |
| impeccable                                              | `pbakaus/impeccable`              | UI critique and polish. **Markdown only**: delete its `scripts/` (it downloads a binary launcher) |
| find-skills                                             | `vercel-labs/skills`              | Finding more skills                                                                               |
| brag                                                    | `latent-spaces/brag`              | Launch video from the project (heavy: ~16 MB; install when needed, don't commit)                  |

Install with the skills CLI (`npx skills add <owner/repo>`), then inspect what landed: delete anything executable (`scripts/`, launchers, binaries) before the first use.

### How the agent works in these repos

- Start every Expo task by checking the SDK version and the versioned docs.
- Before "done": `pnpm lint && pnpm typecheck && pnpm format:check`, and `pnpm test` for API changes (Postgres via `db:test`). For UI, run it and look (simulator or a TestFlight build); say plainly when something couldn't be verified.
- Commits: one topic each, imperative subject, body explains why, `Co-Authored-By` trailer. Push to `main` deploys dev; prod only by tag, only when asked.
- Fix a CI failure you caused immediately; don't leave `main` red.
- Communicate with the user in their language (Polish here); keep code, comments, commits and docs in English.
- Memory: record durable preferences (no binaries, build quota, no secrets in chat) in the agent's memory and in `AGENTS.md`.

---

## 15. Security, abuse and cost baseline

Build these in with the first endpoint that costs money:

- **Per-user burst limit**: Workers Rate Limiting binding keyed by user id (e.g. 6/min for an expensive call).
- **Per-user daily allowance counted on attempts, not successes**: insert an `attempt` row **before** calling the paid service, count the last 24 h, prune the user's rows older than 48 h. (Counting stored results let failed or "not a plant" calls run unlimited: ~$22/day per account at 6/min.)
- **Global cap**: the same binding with one shared key (`'all'`), e.g. 120/min. It's counted per Cloudflare location, so it bounds the pace rather than being an exact total.
- **Hard money cap at the provider**: prepaid credits with **auto top-up off** and a **credit limit on the key** (OpenRouter). This is the only limit that can't be bypassed by a bug.
- **Edge flood protection**: on the Workers Free plan (100k requests/day, then the Worker stops answering) a single WAF rate-limiting rule on the zone matters most. The Free plan only matches on **URI path**: `starts_with(http.request.uri.path, "/v1/") or starts_with(http.request.uri.path, "/api/") or http.request.uri.path eq "/health"`, per IP, 100 requests / 10 s, block 10 s. Test it: a burst of ~130 requests should return some 429s and recover after 10 s.
- **Cheap public endpoints**: `/health` without DB; DB and auth constructed only for `/api` and `/v1`.
- **Uploads**: `Content-Length` check before reading, per-file size cap, magic-byte check, at most N files.
- **Better Auth**: rate limit enabled explicitly, `cf-connecting-ip` as the IP header.
- **Files**: private bucket, short-lived HMAC links, per-user key prefix, constant-time signature compare.
- **No sensitive data in third-party logs**: avoid proxies that log request bodies (user photos ended up in AI Gateway logs).
- **Secrets**: only in `.env` (gitignored) and GitHub environments; Worker secrets as `Config.Redacted`.
- **Before charging money**: Apple App Attest so only the real app on a real device can call the API; dependency audit in CI.

Worst cases to know: Workers Free → a flood means downtime, not a bill; Workers Paid → ~$0.30 per extra million requests; the AI key → whatever its credit limit allows.

---

## 16. Bootstrap order

1. **Accounts and names**: domain on Cloudflare; Apple Developer (individual: your name shows as the seller; see section 18), App Store Connect app records for production and preview bundle ids; Expo account + `eas init`; Neon org API key; OpenRouter key with a credit limit; GitHub repo with environments `dev` and `prod` (prod with required reviewers).
2. **Monorepo**: root `package.json`, `pnpm-workspace.yaml` with catalog and overrides, `turbo.json`, `.nvmrc`, Prettier, `.gitignore`, `packages/tsconfig`, `packages/eslint-config`, `AGENTS.md`.
3. **Database package**: Drizzle schema (Better Auth tables generated + yours), first migration, `createDb`, `authAdapter`, `reset-test-db` script.
4. **API**: env/factory, errors, validation, context, requireUser, Better Auth with Apple + Google + Apple token revocation, `/health`, first feature, `AppType` + `build:types`. Then `alchemy.run.ts` and `alchemy deploy --stage prod` once (creates the Neon project), then `--stage dev`.
5. **API tests**: vitest projects, Docker Postgres, `signedInUser`, tests for auth, ownership and limits.
6. **CI**: the four workflows, secrets, `DEPLOY_ENABLED=true`.
7. **App**: `npx create-expo-app` → move into `apps/mobile`, `app.config.ts` variants, `eas.json`, Uniwind + tokens, i18n with the plural polyfill and the Hermes ESLint guard, auth client + sign-in screen + `Stack.Protected`, typed API client + query client, native tabs, native button/empty-state/form pairs, icons script. First dev client build locally (or one EAS build if the user asks), then `build:preview:local` to TestFlight.
8. **Website**: React Router pre-rendered, PL/EN routes, privacy/terms/support from code facts, deploy.
9. **Limits and WAF rule** (section 15) before anyone outside the team uses it.
10. Then: the actual product.

---

## 17. App Store launch checklist

- [ ] Account deletion inside the app (Settings), deleting server data, files, and revoking Sign in with Apple.
- [ ] Sign in with Apple offered wherever another social login is.
- [ ] Privacy policy, terms and support URLs live, in the app's languages, matching what the code does; controller name and contact email filled in.
- [ ] App Privacy ("nutrition labels") in App Store Connect matching the policy (account info, photos, usage tied to the account, no tracking).
- [ ] `usesNonExemptEncryption: false` (or the export compliance answer).
- [ ] Permission strings in every language (`locales/*.json`), asked in context, not at launch.
- [ ] AI disclaimers where results are shown; Terms say AI output is guidance.
- [ ] EU Digital Services Act trader info: address (a P.O. box is accepted), phone, email; required once the app earns money.
- [ ] Screenshots (the 6.9-inch iPhone set; Apple scales it down), description, keywords, promotional text, review notes (how to sign in; a demo account if sign-in can't be done by the reviewer).
- [ ] Production widget/extension capabilities and profiles set up (section 11).
- [ ] Prod API released (`v*` tag) before the build that needs it; old app versions keep working (additive API changes only).
- [ ] Music and assets in marketing videos licensed for public use.

---

## 18. Business notes (Poland)

- **Seller name**: an individual Apple account shows your legal name. A company name needs an organisation account with a D-U-N-S number, which needs a legal entity (sp. z o.o. or P.S.A.); a JDG doesn't qualify, and a JDG's business name must contain your name anyway. A sole shareholder of a one-person sp. z o.o. pays ZUS like a JDG; P.S.A. shareholders don't. Full accounting costs a few hundred PLN a month, so incorporate when revenue justifies it.
- **Hiding your address**: use a P.O. box (or virtual office) for the App Store trader address, a separate phone number and a support email. In CEIDG your home address isn't public; choose "no fixed place of business" and a virtual office as the delivery address.
- **Payments for digital features in an iOS app**: Apple In-App Purchase (StoreKit 2). External payment links in the EU are allowed but Apple still takes a store-services commission, IAP must be offered alongside, and you handle VAT and refunds, so Stripe saves little. Better Auth's Stripe plugin is for a web version. Without RevenueCat: StoreKit 2 in the app (`expo-iap`), verify signed transactions on the server, App Store Server Notifications v2 webhook, a `subscription` table, `appAccountToken` = a UUID tied to the user.
- **Pricing model that fits cheap AI calls** (~$0.0025 per call): free tier with a small allowance + an unlimited (fair-use capped) subscription, not credits. Annual plan with a 7-day trial as the main offer; no weekly plans.
- **Unit economics**: Apple first removes VAT (23% in PL), then takes 15% (Small Business Program; enrol). 100 PLN paid ≈ 69 PLN received.
- Talk to an accountant before the first payout: Apple pays from Ireland, so you need a business form (JDG or unregistered activity within its limit) and likely VAT-UE registration.

---

## 19. Gotchas log

| Symptom                                                                   | Cause                                                                                                          | Fix                                                                                                                                    |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| App crashes on launch after adding relative dates                         | Hermes has no `Intl.RelativeTimeFormat` (nor ListFormat, Segmenter, DisplayNames, DurationFormat)              | Translated strings + `Intl.DateTimeFormat`; ESLint `no-restricted-properties` guard; `@formatjs/intl-pluralrules` polyfill for plurals |
| "Invalid hook call" / two Reacts in the native build                      | `react-dom` auto-installed as a peer at a newer version                                                        | Catalog-pin `react` and `react-dom` to RN's version + pnpm `overrides`                                                                 |
| "socket closed" errors from Postgres on Workers                           | `prepare: false` and/or `client.end()` behind Hyperdrive                                                       | Remove both; one client per request                                                                                                    |
| Raw SQL with a `Date` parameter fails on Workers                          | postgres.js serialisation of `Date` in `sql\`\``                                                               | `date.toISOString()` + `::timestamptz`, or Drizzle operators                                                                           |
| `fastlane` install broke CocoaPods                                        | Ruby upgrade                                                                                                   | `brew upgrade cocoapods`                                                                                                               |
| `eas submit` targets the production app                                   | `APP_VARIANT` unset during submit                                                                              | Prefix submit with `APP_VARIANT=<variant>`                                                                                             |
| expo-widgets build fails at "Build ExpoWidgets Bundle"                    | Local build dir under `/var/folders` (symlink to `/private/var`) confuses the layout step                      | `EAS_LOCAL_BUILD_WORKINGDIR=$HOME/.cache/eas-local-build`                                                                              |
| "Failed to sync capabilities … App Groups"                                | App Store Connect API can't set App Groups                                                                     | Tick it in the Developer portal; `EXPO_NO_CAPABILITY_SYNC=1` if needed                                                                 |
| "Credentials are not set up. Run this command again in interactive mode." | New extension target needs a provisioning profile                                                              | Interactive `eas credentials --platform ios` once                                                                                      |
| Quick action from a closed app opens home, works when backgrounded        | UIScene lifecycle forwards the cold-start shortcut before JS listens; library read it only from launch options | pnpm patch: store it as the initial action when JS isn't listening yet; read `initial` lazily (`Property` instead of `Constants`)      |
| Haptic on the shutter does nothing                                        | iOS mutes haptics while the camera runs                                                                        | Confirm with a haptic when the result arrives                                                                                          |
| Empty list scrolls and the tab bar minimises                              | Empty state rendered inside the list                                                                           | Render empty states outside the list                                                                                                   |
| White label on a light-green button unreadable in dark mode               | One accent token for text and fills (1.85:1)                                                                   | Separate `accent` and `accent-fill` tokens                                                                                             |
| Lint fails in CI on a test                                                | Pushed without running lint                                                                                    | Run the full check before every push                                                                                                   |
| A deploy didn't apply a new secret-driven setting                         | Secret missing from the deploy workflow `env:`                                                                 | List every secret Alchemy reads in `deploy.yml`                                                                                        |
| Revoking a token broke production                                         | Prod still ran the version that used it                                                                        | Deploy the version that stops using a credential before revoking it                                                                    |
| A new route is a type error                                               | Typed routes not regenerated                                                                                   | Run `expo start` once (regenerates `.expo/types`)                                                                                      |
| Model gives different safety levels for the same species                  | Vague level definitions in the prompt                                                                          | Define each level by its worst effect, with examples; measure consistency on the eval set                                              |
| Simulator commands hang (`simctl list` never returns)                     | CoreSimulator service stuck                                                                                    | Restart Xcode/Simulator; test on TestFlight meanwhile                                                                                  |
