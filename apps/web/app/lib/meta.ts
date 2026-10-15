import type { MetaDescriptor } from 'react-router';

import { langFromPath, localePath } from '~/i18n';
import { SITE } from '~/site';

/** Title, description, canonical URL and hreflang alternates for a page. */
export function pageMeta(pathname: string, title: string, description: string): MetaDescriptor[] {
  const lang = langFromPath(pathname);
  const bare = lang === 'en' ? pathname.replace(/^\/en/, '') || '/' : pathname;
  const url = (path: string) => `${SITE.url}${path === '/' ? '' : path}`;

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: url(pathname) },
    { property: 'og:image', content: `${SITE.url}/apple-touch-icon.png` },
    { tagName: 'link', rel: 'canonical', href: url(pathname) },
    { tagName: 'link', rel: 'alternate', hrefLang: 'pl', href: url(localePath('pl', bare)) },
    { tagName: 'link', rel: 'alternate', hrefLang: 'en', href: url(localePath('en', bare)) },
    { tagName: 'link', rel: 'alternate', hrefLang: 'x-default', href: url(localePath('pl', bare)) },
  ];
}
