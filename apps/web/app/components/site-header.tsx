import { Link, useLocation } from 'react-router';

import { Button } from '~/components/ui/button';
import { ui } from '~/content/ui';
import { localePath, switchLangPath, useLang } from '~/i18n';

export function SiteHeader() {
  const lang = useLang();
  const { pathname } = useLocation();

  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
      <Link to={localePath(lang, '/')} className="flex items-center gap-2.5">
        <img src="/sprout.webp" alt="" width={32} height={32} className="size-8" />
        <span className="font-rounded text-xl font-extrabold tracking-tight">PlantCare</span>
      </Link>
      <Button asChild variant="ghost" size="sm">
        <Link to={switchLangPath(pathname)} hrefLang={lang === 'pl' ? 'en' : 'pl'}>
          {ui[lang].nav.switchLang}
        </Link>
      </Button>
    </header>
  );
}
