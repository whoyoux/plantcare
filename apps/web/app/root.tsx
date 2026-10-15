import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation } from 'react-router';

import type { Route } from './+types/root';
import './app.css';
import { SiteFooter } from '~/components/site-footer';
import { SiteHeader } from '~/components/site-header';
import { langFromPath } from '~/i18n';

export const links: Route.LinksFunction = () => [
  { rel: 'icon', type: 'image/png', href: '/favicon.png' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const lang = langFromPath(useLocation().pathname);

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f3f6f2" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0c110e" media="(prefers-color-scheme: dark)" />
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  return (
    <main className="mx-auto max-w-2xl px-5 pt-16">
      <h1 className="text-4xl font-extrabold">{status === 404 ? '404' : 'Error'}</h1>
    </main>
  );
}
