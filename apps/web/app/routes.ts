import { index, prefix, route, type RouteConfig } from '@react-router/dev/routes';

// Polish at the root, English under /en. Same modules, separate ids per language.
const pages = (lang: 'pl' | 'en') => [
  index('routes/home.tsx', { id: `${lang}-home` }),
  route('privacy', 'routes/privacy.tsx', { id: `${lang}-privacy` }),
  route('terms', 'routes/terms.tsx', { id: `${lang}-terms` }),
  route('support', 'routes/support.tsx', { id: `${lang}-support` }),
];

export default [
  ...pages('pl'),
  ...prefix('en', pages('en')),
  // Pre-rendered and copied to 404.html for Cloudflare's 404 handling.
  route('404', 'routes/not-found.tsx'),
] satisfies RouteConfig;
