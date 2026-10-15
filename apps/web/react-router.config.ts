import type { Config } from '@react-router/dev/config';

// Fully static site: every page is pre-rendered to HTML at build time and served from Cloudflare.
export default {
  ssr: false,
  prerender: true,
} satisfies Config;
