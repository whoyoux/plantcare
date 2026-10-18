# PlantCare

iOS app that identifies plants from a photo, explains how to care for them and reminds you to water them. The interface is in Polish and English.

**Source-available, not open source.** See [LICENSE](LICENSE): viewing only, with no use, copying or redistribution.

## What's inside

| Path                                          | What it is                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile`                                 | Expo SDK 58 app (Expo Router, native tabs, dev client + CNG), iOS-first                                                                                                     |
| `apps/api`                                    | Hono API on Cloudflare Workers: Better Auth (Sign in with Apple / Google), Neon Postgres via Hyperdrive, photos in R2, plant identification through AI Gateway → OpenRouter |
| `apps/web`                                    | Website with legal pages (React Router, pre-rendered, served as Worker static assets)                                                                                       |
| `packages/db`                                 | Drizzle schema and migrations                                                                                                                                               |
| `packages/shared`                             | Shared Zod schemas, the identification prompt, languages                                                                                                                    |
| `packages/eslint-config`, `packages/tsconfig` | Shared tooling config                                                                                                                                                       |
| `tools/ai-eval`                               | Model and prompt evaluation for plant identification ([results](tools/ai-eval/RESULTS.md))                                                                                  |

pnpm workspaces + Turborepo, Node 24. Infrastructure is code: [Alchemy](https://alchemy.run) (`alchemy.run.ts` in `apps/api` and `apps/web`).

| Stage  | API                        | Website                |
| ------ | -------------------------- | ---------------------- |
| `prod` | api.plantcare.whxx.dev     | plantcare.whxx.dev     |
| `dev`  | api-dev.plantcare.whxx.dev | dev.plantcare.whxx.dev |

The development and preview (TestFlight) app builds talk to `dev`, the App Store build to `prod`.

## Development

```bash
pnpm install
pnpm --filter @plantcare/mobile dev   # Metro for the dev client
pnpm --filter @plantcare/api dev      # API locally (alchemy dev, dev stage)
pnpm --filter @plantcare/web dev      # website
```

Rebuild the dev client only after adding a native module or changing `app.config.ts`; JS changes reload live. The app variant comes from `APP_VARIANT` (`development` | `preview` | `production`), see `apps/mobile/app.config.ts`.

Secrets live in `apps/api/.env` locally (Apple key, `OPENROUTER_API_KEY`, `AI_GATEWAY_TOKEN`) and in the GitHub environments `dev` and `prod` for CI. They are never committed.

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm format:check
pnpm --filter @plantcare/api db:test   # Postgres in Docker for the integration tests
pnpm test
```

## Releases

- **API and website:** a push to `main` deploys to `dev`. A `v*` tag deploys to `prod` after a manual approval in the `prod` environment.
- **iOS app:** built on this Mac, not on EAS (the monthly EAS build quota is tiny), then uploaded to TestFlight:

  ```bash
  pnpm --filter @plantcare/mobile build:preview:local   # TestFlight preview build
  pnpm --filter @plantcare/mobile build:prod:local      # App Store build
  ```

  Needs Xcode, CocoaPods, fastlane and `LANG=en_US.UTF-8`.

- **Over-the-air updates** (`update:preview`, `update:prod`) are for fixes only. New features need a new build and App Review (see [AGENTS.md](AGENTS.md#over-the-air-updates-eas-update-and-app-review)).

## Limits and cost safeguards

Per user: 6 identifications a minute and 30 a rolling day. Every model call counts toward these, including photos without a plant. The AI Gateway requires a token, caps requests per minute and has a daily spend cap. The OpenRouter key has its own credit limit. A Cloudflare rate-limiting rule blocks floods on the API paths.
