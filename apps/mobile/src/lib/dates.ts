const DAY_MS = 24 * 60 * 60 * 1000;

/** "today", "yesterday", "3 days ago" within a week; a short date after that. */
export function relativeDay(iso: string, language: string, now = new Date()) {
  const date = new Date(iso);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (days >= 0 && days < 7) {
    return new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(-days, 'day');
  }
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' }).format(date);
}
