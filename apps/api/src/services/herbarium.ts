import { BADGES, LOOKALIKE_PAIRS, type BadgeId, type PlantCategory } from '@plantcare/shared';

/** One identification as the herbarium needs it (a few columns, not the whole result). */
export type HerbariumEntry = {
  id: string;
  createdAt: Date;
  scientificName: string;
  commonName: string | null;
  family: string | null;
  confidence: number;
  imageKey: string;
  category: PlantCategory | null;
  /** The model rated it harmful ("mild" or "toxic") for cats, dogs or people. */
  toxic: boolean;
};

export type HerbariumSpecies = {
  /** Lower-cased scientific name: one tile per species however often it was found. */
  key: string;
  scientificName: string;
  commonName: string | null;
  family: string | null;
  /** Only the genus was certain (e.g. "Mentha"). */
  genusOnly: boolean;
  category: PlantCategory | null;
  toxic: boolean;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  /** The most confident photo stands for the species. */
  best: { id: string; imageKey: string };
  /** Newest first. */
  entries: { id: string; imageKey: string; createdAt: Date }[];
};

export type BadgeProgress = {
  id: BadgeId;
  /** Levels earned (0 = locked); `maxLevel` is 1 for single badges. */
  level: number;
  maxLevel: number;
  current: number;
  /** The next level's threshold, or the top one once maxed. */
  target: number;
  /** When the current level was earned. */
  earnedAt: Date | null;
};

export type Herbarium = {
  /** Newest discovery first. */
  species: HerbariumSpecies[];
  familyCount: number;
  badges: BadgeProgress[];
  /** The unfinished badge closest to its next level, for the home card and the widget. */
  next: BadgeProgress | null;
};

const byDate = (a: Date, b: Date) => a.getTime() - b.getTime();

function groupSpecies(entries: HerbariumEntry[]): HerbariumSpecies[] {
  const groups = new Map<string, HerbariumEntry[]>();
  for (const entry of entries) {
    const key = entry.scientificName.trim().toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  return [...groups.entries()]
    .map(([key, group]) => {
      const newest = [...group].sort((a, b) => byDate(b.createdAt, a.createdAt));
      const latest = newest[0]!;
      const best = group.reduce((top, entry) => (entry.confidence > top.confidence ? entry : top));
      return {
        key,
        scientificName: latest.scientificName,
        commonName: newest.find((entry) => entry.commonName)?.commonName ?? null,
        family: newest.find((entry) => entry.family)?.family ?? null,
        genusOnly: !latest.scientificName.trim().includes(' '),
        category: newest.find((entry) => entry.category)?.category ?? null,
        toxic: latest.toxic,
        count: group.length,
        firstSeen: newest.at(-1)!.createdAt,
        lastSeen: latest.createdAt,
        best: { id: best.id, imageKey: best.imageKey },
        entries: newest.map(({ id, imageKey, createdAt }) => ({ id, imageKey, createdAt })),
      };
    })
    .sort((a, b) => byDate(b.firstSeen, a.firstSeen));
}

/** When each family was first found, oldest first. */
function familyDates(species: HerbariumSpecies[]) {
  const first = new Map<string, Date>();
  for (const item of species) {
    if (!item.family) continue;
    const seen = first.get(item.family);
    if (!seen || item.firstSeen < seen) first.set(item.family, item.firstSeen);
  }
  return [...first.values()].sort(byDate);
}

/** When each look-alike pair was completed (both halves found), oldest first. */
function lookalikeDates(species: HerbariumSpecies[]) {
  const firstMatch = (prefix: string) =>
    species
      .filter((item) => item.key.startsWith(prefix.toLowerCase()))
      .map((item) => item.firstSeen)
      .sort(byDate)[0];
  return LOOKALIKE_PAIRS.flatMap(([a, b]) => {
    const [seenA, seenB] = [firstMatch(a), firstMatch(b)];
    return seenA && seenB ? [seenA > seenB ? seenA : seenB] : [];
  }).sort(byDate);
}

function progress(id: BadgeId, levels: readonly number[], dates: Date[]): BadgeProgress {
  const level = levels.filter((threshold) => dates.length >= threshold).length;
  return {
    id,
    level,
    maxLevel: levels.length,
    current: dates.length,
    target: levels[Math.min(level, levels.length - 1)]!,
    earnedAt: level > 0 ? dates[levels[level - 1]! - 1]! : null,
  };
}

/**
 * The herbarium is a view over History, so deleting a wrong identification also takes it out of
 * the collection. `plantDates` are when the user's plants were added (for "Caretaker").
 */
export function buildHerbarium(entries: HerbariumEntry[], plantDates: Date[] = []): Herbarium {
  const species = groupSpecies(entries);
  const oldestFirst = (list: HerbariumSpecies[]) => list.map((item) => item.firstSeen).sort(byDate);
  const families = familyDates(species);

  const datesFor = (kind: (typeof BADGES)[number]['kind']): Date[] => {
    switch (kind) {
      case 'species':
        return oldestFirst(species);
      case 'families':
        return families;
      case 'toxic':
        return oldestFirst(species.filter((item) => item.toxic));
      case 'lookalikes':
        return lookalikeDates(species);
      case 'plants':
        return [...plantDates].sort(byDate);
      default:
        return oldestFirst(species.filter((item) => item.category === kind));
    }
  };

  const badges = BADGES.map((badge) => progress(badge.id, badge.levels, datesFor(badge.kind)));
  const next =
    badges
      .filter((badge) => badge.level < badge.maxLevel)
      .sort((a, b) => b.current / b.target - a.current / a.target)[0] ?? null;

  return { species, familyCount: families.length, badges, next };
}

/** Badges whose level went up between two herbariums (to celebrate on the result screen). */
export function newBadges(before: Herbarium, after: Herbarium) {
  return after.badges
    .filter((badge) => badge.level > (before.badges.find((old) => old.id === badge.id)?.level ?? 0))
    .map(({ id, level, maxLevel }) => ({ id, level, maxLevel }));
}
