# PlantCare monorepo

pnpm workspaces + Turborepo. The Expo app lives in `apps/mobile` — run every `npx expo …` / `eas …` command from that directory. Shared versions go in the pnpm catalog (`pnpm-workspace.yaml`). App identity comes from `APP_VARIANT` (development | preview | production) in `apps/mobile/app.config.ts`.

Before declaring work done, run from the repo root: `pnpm lint`, `pnpm typecheck`, `pnpm format:check` (`pnpm format` fixes formatting). API changes also need `pnpm test` (integration tests need Postgres: `pnpm --filter @plantcare/api db:test` starts it in Docker).

CI (`.github/workflows`): every push and PR runs format, lint, typecheck and tests; a push to `main` deploys the API and website to dev; a `v*` tag deploys them to prod. EAS builds are never started from CI or by agents without the user asking (tiny monthly quota). ESLint: `eslint-config-expo` in apps/mobile, `@plantcare/eslint-config/base` (typescript-eslint, type-checked) elsewhere; Prettier owns formatting.

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Over-the-air updates (EAS Update) and App Review

Apple's rules (App Review Guidelines 2.5.2 and 2.5.19, Developer Program License Agreement 3.3.1(B)/(C)) allow downloading JavaScript only if it does not introduce or change features. Since 16 Oct 2026, guideline 2.5.19 explicitly treats adding features after review (including hidden or remotely enabled ones) as grounds for removing the app and terminating the developer account.

- **OK over the air:** bug and crash fixes, copy and translation fixes, small visual fixes on existing screens, performance work.
- **Needs a new build and App Review:** any new screen, flow or capability, changes to what an existing feature does, and anything native.
- **Never:** feature flags or remote config that switch on functionality App Review did not see.
- Server-side changes (API, prompts, model choice, limits) are fine as long as the app's features stay the same.
