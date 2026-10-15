# PlantCare

iOS app that identifies plants and trees from a photo and gives care instructions.

**Source-available, not open source.** See [LICENSE](LICENSE): viewing only — no use, copying, or redistribution.

## Stack

- `apps/mobile` — Expo (SDK 57, Expo Router, dev client + CNG), iOS-first
- `apps/api` — Hono on Cloudflare Workers _(planned)_
- `packages/*` — shared Zod schemas, Drizzle DB, tsconfig

pnpm workspaces + Turborepo, Node 24.

## Development

Native builds run on EAS; locally only Metro runs.

```bash
pnpm install
pnpm --filter @plantcare/mobile build:dev   # dev client build on EAS (install via QR/link)
pnpm --filter @plantcare/mobile dev         # Metro for the dev client (same Wi-Fi)
pnpm --filter @plantcare/mobile dev:tunnel  # Metro over a tunnel (any network)
```

Rebuild only after adding a native module or changing `app.config.ts`; JS changes reload live.

App variants are selected with `APP_VARIANT` (`development` | `preview` | `production`), see `apps/mobile/app.config.ts`.
