import { Bell, Camera, Droplet, LayoutGrid, ShieldCheck, Smartphone, TriangleAlert, X } from 'lucide-react';
import { Link } from 'react-router';

import type { Route } from './+types/home';
import { Button } from '~/components/ui/button';
import { LaunchVideo } from '~/components/launch-video';
import { ui } from '~/content/ui';
import { langFromPath, localePath, useLang, type Lang } from '~/i18n';
import { pageMeta } from '~/lib/meta';

export function meta({ location }: Route.MetaArgs) {
  const t = ui[langFromPath(location.pathname)];
  return pageMeta(location.pathname, t.meta.title, t.meta.description);
}

export default function Home() {
  const lang = useLang();
  const t = ui[lang];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-5 pt-4 sm:pt-10">
      <section className="grid items-center gap-12 md:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col items-start gap-6">
          <h1 className="text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">{t.hero.title}</h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{t.hero.body}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-12 items-center rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground">
              {t.hero.soon}
            </span>
            <Button asChild variant="ghost" className="h-12 rounded-full px-5 text-base">
              <a href="#how">{t.hero.how}</a>
            </Button>
          </div>
        </div>
        <ResultPhone lang={lang} />
      </section>

      <section className="flex flex-col gap-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.features.title}</h2>
        <Features lang={lang} />
      </section>

      <section id="how" className="flex scroll-mt-8 flex-col gap-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.video.title}</h2>
        <LaunchVideo lang={lang} label={t.video.label} />
      </section>

      <section className="flex flex-col items-start gap-6 rounded-[32px] bg-primary p-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:p-10">
        <div className="flex gap-4">
          <ShieldCheck className="mt-1 size-7 shrink-0" aria-hidden />
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-bold">{t.privacy.title}</h2>
            <p className="max-w-xl leading-relaxed opacity-80">{t.privacy.body}</p>
          </div>
        </div>
        <Link
          to={localePath(lang, '/privacy')}
          className="inline-flex h-12 shrink-0 items-center rounded-full bg-primary-foreground px-6 font-semibold text-primary hover:opacity-90"
        >
          {t.privacy.link}
        </Link>
      </section>
    </main>
  );
}

/**
 * The app's result screen in a phone: the photo edge to edge, the details on a card over it. The
 * phone is a fixed near-black in both themes (like the hardware), and the screen clips everything
 * to its own corners.
 */
function ResultPhone({ lang }: { lang: Lang }) {
  const t = ui[lang].phone;

  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[54px] bg-[#0b0e0c] p-[9px] shadow-2xl shadow-black/25 ring-1 ring-black/5 dark:shadow-black/60 dark:ring-white/10">
      <div className="relative aspect-[9/19.5] overflow-hidden rounded-[45px] bg-card">
        <div className="relative h-[43%]">
          <img
            src="/photos/monstera.webp"
            alt=""
            width={900}
            height={1078}
            fetchPriority="high"
            className="size-full object-cover object-[50%_20%]"
          />
          <span aria-hidden className="absolute left-1/2 top-2.5 h-6 w-[88px] -translate-x-1/2 rounded-full bg-black" />
          <span
            aria-hidden
            className="absolute left-4 top-12 flex size-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
          >
            <X className="size-4" />
          </span>
          <span className="absolute bottom-9 left-4 rounded-full bg-[#c8372b] px-3 py-1 text-xs font-bold text-white">
            {t.toxic}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 top-[calc(43%-1.5rem)] flex flex-col gap-3 rounded-t-[26px] bg-card px-4 pt-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-[22px] font-bold leading-tight tracking-tight">{t.name}</p>
              <p className="font-latin text-[15px] italic text-muted-foreground">
                Monstera deliciosa <span className="font-sans text-[13px] not-italic">· Araceae</span>
              </p>
            </div>
            <span className="mt-1 shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
              {t.match}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-[18px] bg-[#c8372b] px-3.5 py-3 text-white">
            <p className="flex items-center gap-2 text-sm font-bold">
              <TriangleAlert className="size-4 shrink-0" aria-hidden />
              {t.toxicFor}
            </p>
            <p className="text-[13px] leading-snug text-white/90">{t.toxicNote}</p>
          </div>
          <div className="flex flex-col divide-y divide-border rounded-[18px] bg-muted">
            {t.rows.map((row) => (
              <div key={row.label} className="flex flex-col px-3.5 py-2">
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className="text-sm">{row.value}</span>
              </div>
            ))}
          </div>
          <span className="mt-auto mb-6 flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-bold text-primary-foreground">
            <Droplet className="size-3.5" aria-hidden />
            {t.add}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Photo tiles and cards for what the app does, laid out as a grid that stacks on phones. */
function Features({ lang }: { lang: Lang }) {
  const t = ui[lang].features;

  return (
    <div className="grid gap-4 md:grid-cols-6">
      <PhotoTile
        className="md:col-span-4"
        src="/photos/mint.webp"
        label={t.identify.label}
        icon={<Camera className="size-5" aria-hidden />}
        title={t.identify.title}
        body={t.identify.body}
      />
      <article className="flex flex-col justify-between gap-6 rounded-[28px] bg-card p-6 md:col-span-2">
        <div className="flex flex-col gap-2">
          <TriangleAlert className="size-6 text-destructive" aria-hidden />
          <h3 className="text-xl font-bold">{t.toxic.title}</h3>
          <p className="leading-relaxed text-muted-foreground">{t.toxic.body}</p>
        </div>
        <div className="flex items-center gap-2 rounded-[18px] bg-destructive px-4 py-3 text-sm font-bold text-white">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          {t.toxic.banner}
        </div>
      </article>
      <PhotoTile
        className="md:col-span-3"
        src="/photos/fiddle-leaf-fig.webp"
        label={t.herbarium.label}
        icon={<LayoutGrid className="size-5" aria-hidden />}
        title={t.herbarium.title}
        body={t.herbarium.body}
      />
      <article className="flex flex-col justify-between gap-6 rounded-[28px] bg-card p-6 md:col-span-3">
        <div className="flex flex-col gap-2">
          <Bell className="size-6 text-leaf" aria-hidden />
          <h3 className="text-xl font-bold">{t.water.title}</h3>
          <p className="leading-relaxed text-muted-foreground">{t.water.body}</p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-[18px] bg-muted py-2.5 pl-4 pr-2.5">
          <span className="text-sm font-semibold">{t.water.sample}</span>
          <span
            aria-hidden
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-bold text-primary-foreground"
          >
            <Droplet className="size-3.5" aria-hidden />
          </span>
        </div>
      </article>
      <article className="flex items-center gap-4 rounded-[28px] bg-card p-6 md:col-span-6">
        <Smartphone className="size-6 shrink-0 text-leaf" aria-hidden />
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-bold">{t.widgets.title}</h3>
          <p className="leading-relaxed text-muted-foreground">{t.widgets.body}</p>
        </div>
      </article>
    </div>
  );
}

function PhotoTile({
  src,
  label,
  icon,
  title,
  body,
  className,
}: {
  src: string;
  label: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <article className={`flex flex-col overflow-hidden rounded-[28px] bg-card ${className ?? ''}`}>
      <div className="relative h-64 sm:h-72">
        <img src={src} alt="" width={900} height={600} loading="lazy" className="size-full object-cover" />
        <span className="absolute bottom-3 left-3 rounded-[18px] bg-black/60 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
          {label}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-6">
        <span className="text-leaf">{icon}</span>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </article>
  );
}
