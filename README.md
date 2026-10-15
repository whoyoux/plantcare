# PlantCare

iOS app that identifies plants and trees from a photo and gives care instructions.

**Source-available, not open source.** See [LICENSE](LICENSE): viewing only — no use, copying, or redistribution.

## Stack

- `apps/mobile` — Expo (SDK 57, Expo Router, dev client + CNG), iOS-first
- `apps/api` — Hono on Cloudflare Workers *(planned)*
- `packages/*` — shared Zod schemas, Drizzle DB, tsconfig

pnpm workspaces + Turborepo, Node 24.

## Development

```bash
pnpm install
pnpm --filter @plantcare/mobile ios:device   # dev build on a connected iPhone
pnpm --filter @plantcare/mobile dev          # Metro for the dev client
```

App variants are selected with `APP_VARIANT` (`development` | `preview` | `production`), see `apps/mobile/app.config.ts`.
