import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';

import type { Route } from './+types/home';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Viewfinder } from '~/components/viewfinder';
import { ui } from '~/content/ui';
import { langFromPath, localePath, useLang } from '~/i18n';
import { pageMeta } from '~/lib/meta';

export function meta({ location }: Route.MetaArgs) {
  const t = ui[langFromPath(location.pathname)];
  return pageMeta(location.pathname, t.meta.title, t.meta.description);
}

export default function Home() {
  const lang = useLang();
  const t = ui[lang];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-24 px-5 pt-6 sm:pt-12">
      <section className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col items-start gap-6">
          <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">{t.hero.title}</h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{t.hero.body}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="h-9 rounded-full px-4 text-sm">
              {t.hero.soon}
            </Badge>
            <Button asChild variant="ghost">
              <a href="#how">{t.hero.how}</a>
            </Button>
          </div>
        </div>
        <SpecimenPhone lang={lang} />
      </section>

      <section id="how" className="flex scroll-mt-8 flex-col gap-8">
        <h2 className="text-3xl font-bold tracking-tight">{t.steps.title}</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {t.steps.items.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full">
                <CardContent className="flex flex-col gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-secondary font-rounded text-lg font-extrabold text-primary">
                    {index + 1}
                  </span>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{step.body}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col items-start gap-4 rounded-3xl bg-secondary p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <ShieldCheck className="mt-1 size-7 shrink-0 text-primary" aria-hidden />
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold">{t.privacy.title}</h2>
            <p className="max-w-xl leading-relaxed text-muted-foreground">{t.privacy.body}</p>
          </div>
        </div>
        <Button asChild variant="outline" className="bg-card">
          <Link to={localePath(lang, '/privacy')}>{t.privacy.link}</Link>
        </Button>
      </section>
    </main>
  );
}

/** The app's result sheet, drawn in a phone: the photo framed by the viewfinder, then the specimen card. */
function SpecimenPhone({ lang }: { lang: 'pl' | 'en' }) {
  const t = ui[lang].specimen;

  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[48px] border-[10px] border-foreground/90 bg-background p-4 shadow-2xl shadow-primary/15">
      <div className="relative mx-auto my-4 flex size-44 items-center justify-center">
        <Viewfinder />
        <img src="/sprout.webp" alt="" width={240} height={240} className="size-32" />
      </div>
      <Card className="gap-4 py-5">
        <CardContent className="flex flex-col gap-1 px-5">
          <p className="font-rounded text-2xl font-extrabold leading-tight">{t.name}</p>
          <p className="font-latin text-lg italic text-muted-foreground">
            Monstera deliciosa <span className="not-italic">· Araceae</span>
          </p>
          <Badge className="mt-2 rounded-full">{t.match}</Badge>
        </CardContent>
        <CardContent className="flex flex-col gap-3 px-5">
          <p className="font-rounded font-bold">{t.care}</p>
          {t.rows.map((row) => (
            <div key={row.label} className="flex flex-col">
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className="text-sm">{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
