import { useEffect, useState } from 'react';

import type { Lang } from '~/i18n';

/** Phones get the 9:16 cut; the prerendered page starts with 16:9 and switches after hydration. */
const PHONE_QUERY = '(max-width: 767px)';

export function LaunchVideo({ lang, label }: { lang: Lang; label: string }) {
  const [vertical, setVertical] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY);
    const update = () => setVertical(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const name = `/video/plantcare-${lang}-${vertical ? 'vertical' : 'landscape'}`;

  return (
    <video
      // A new element per format, so the browser loads the right file and restarts playback.
      key={name}
      src={`${name}.mp4`}
      poster={`${name}.webp`}
      aria-label={label}
      autoPlay
      muted
      loop
      playsInline
      controls
      preload="metadata"
      className={`w-full rounded-[28px] bg-card shadow-xl shadow-black/10 ${
        vertical ? 'mx-auto aspect-[9/16] max-w-sm' : 'aspect-video'
      }`}
    />
  );
}
