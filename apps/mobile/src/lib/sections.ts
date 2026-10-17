const DAY_MS = 24 * 60 * 60 * 1000;

export type DaySection<T> = { key: string; title: string; data: T[] };

type Labels = { today: string; yesterday: string; thisWeek: string };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * Groups newest-first items into "Today", "Yesterday", "This week", then one section per month
 * ("October 2026"). Keeps the input order inside each section.
 */
export function groupByDay<T extends { createdAt: string }>(
  items: T[],
  language: string,
  labels: Labels,
  now = new Date(),
): DaySection<T>[] {
  const month = new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' });
  const sections: DaySection<T>[] = [];

  for (const item of items) {
    const date = new Date(item.createdAt);
    const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
    let key: string;
    let title: string;
    if (days <= 0) [key, title] = ['today', labels.today];
    else if (days === 1) [key, title] = ['yesterday', labels.yesterday];
    else if (days < 7) [key, title] = ['week', labels.thisWeek];
    else {
      key = `${date.getFullYear()}-${date.getMonth()}`;
      const name = month.format(date);
      title = name.charAt(0).toUpperCase() + name.slice(1);
    }

    const last = sections[sections.length - 1];
    if (last?.key === key) last.data.push(item);
    else sections.push({ key, title, data: [item] });
  }
  return sections;
}
