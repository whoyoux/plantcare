import { Link } from 'react-router';

import { Button } from '~/components/ui/button';
import { ui } from '~/content/ui';

export function meta() {
  return [{ title: '404 · PlantCare' }, { name: 'robots', content: 'noindex' }];
}

// Served by Cloudflare for unknown paths (copied to 404.html after the build), in both languages.
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-start gap-4 px-5 pt-16">
      <h1 className="text-4xl font-bold tracking-tight">{ui.pl.notFound.title}</h1>
      <p className="text-muted-foreground">
        {ui.pl.notFound.body} / {ui.en.notFound.body}
      </p>
      <Button asChild>
        <Link to="/">{ui.pl.notFound.home}</Link>
      </Button>
    </main>
  );
}
