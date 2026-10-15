import type { Route } from './+types/privacy';
import { LegalPage } from '~/components/legal-page';
import { legal } from '~/content/legal';
import { langFromPath, useLang } from '~/i18n';
import { pageMeta } from '~/lib/meta';

export function meta({ location }: Route.MetaArgs) {
  const doc = legal.privacy[langFromPath(location.pathname)];
  return pageMeta(location.pathname, `${doc.title} · PlantCare`, doc.description);
}

export default function Page() {
  return <LegalPage doc={legal.privacy[useLang()]} />;
}
