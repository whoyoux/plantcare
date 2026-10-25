import { Link } from 'react-router';

import { Separator } from '~/components/ui/separator';
import { ui } from '~/content/ui';
import { localePath, useLang } from '~/i18n';

export function SiteFooter() {
  const lang = useLang();
  const t = ui[lang];
  const links = [
    { to: '/privacy', label: t.nav.privacy },
    { to: '/terms', label: t.nav.terms },
    { to: '/support', label: t.nav.support },
  ];

  return (
    <footer className="mx-auto w-full max-w-5xl px-5 pb-10 pt-16">
      <Separator />
      <div className="flex flex-col gap-4 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((link) => (
            <Link key={link.to} to={localePath(lang, link.to)} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1 sm:items-end">
          <p>
            © {new Date().getFullYear()} PlantCare. {t.footer.rights}
          </p>
          <p className="text-xs">{t.footer.photos}</p>
        </div>
      </div>
    </footer>
  );
}
