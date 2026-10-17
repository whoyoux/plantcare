const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * "Today", "Yesterday", the weekday within a week, a short date after that.
 * Hermes (React Native's JS engine) has no Intl.RelativeTimeFormat, so this only uses
 * Intl.DateTimeFormat plus translated words.
 */
export function relativeDay(
  iso: string,
  language: string,
  labels: { today: string; yesterday: string },
  now = new Date(),
) {
  const date = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (days <= 0) return labels.today;
  if (days === 1) return labels.yesterday;
  if (days < 7) return new Intl.DateTimeFormat(language, { weekday: 'long' }).format(date);
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' }).format(date);
}
