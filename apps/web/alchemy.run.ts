import * as Alchemy from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';
import * as Effect from 'effect/Effect';

// Marketing site and legal pages: pre-rendered HTML served as Worker static assets.
const DOMAINS: Record<string, string> = {
  prod: 'plantcare.whxx.dev',
  dev: 'dev.plantcare.whxx.dev',
};

export const Website = Effect.gen(function* () {
  const { stage } = yield* Alchemy.Stack;
  return yield* Cloudflare.Website.StaticSite('Website', {
    command: 'pnpm build',
    outdir: 'build/client',
    domain: DOMAINS[stage],
    // /privacy serves privacy/index.html; unknown paths get the pre-rendered 404 page.
    assets: { htmlHandling: 'auto-trailing-slash', notFoundHandling: '404-page' },
    dev: { command: 'pnpm dev' },
  });
});

export default Alchemy.Stack(
  'PlantCareWeb',
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const website = yield* Website;
    return { url: website.url.as<string>() };
  }),
);
