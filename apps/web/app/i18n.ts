import { useLocation } from 'react-router';

export type Lang = 'pl' | 'en';

/** Polish lives at the root, English under /en. */
export function langFromPath(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'pl';
}

export function useLang(): Lang {
  return langFromPath(useLocation().pathname);
}

/** Path of a page in the given language, e.g. localePath('en', '/privacy') → '/en/privacy'. */
export function localePath(lang: Lang, path: string) {
  if (lang === 'pl') return path;
  return path === '/' ? '/en' : `/en${path}`;
}

/** The same page in the other language. */
export function switchLangPath(pathname: string): string {
  const lang = langFromPath(pathname);
  const bare = lang === 'en' ? pathname.replace(/^\/en/, '') || '/' : pathname;
  return localePath(lang === 'en' ? 'pl' : 'en', bare);
}

export function formatDate(iso: string, lang: Lang) {
  return new Date(iso).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
