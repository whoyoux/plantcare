import { useQuery } from '@tanstack/react-query';
import type { InferResponseType } from 'hono/client';

import { api, ensureOk } from '@/lib/api';
import { historyKeys } from '@/lib/identifications';

export type HerbariumData = InferResponseType<typeof api.v1.herbarium.$get, 200>;
export type Species = HerbariumData['species'][number];
export type Badge = HerbariumData['badges'][number];

/** Under `history`, so new or deleted identifications and plant changes refresh it too. */
export const herbariumKey = [...historyKeys.all, 'herbarium'] as const;

export function useHerbarium() {
  return useQuery({
    queryKey: herbariumKey,
    queryFn: async () => (await ensureOk(await api.v1.herbarium.$get())).json(),
  });
}

export type HerbariumSort = 'newest' | 'name' | 'family';

const displayName = (species: Species) => species.commonName ?? species.scientificName;

/** Rows of three tiles, with a heading row before each family when sorted by family. */
export type GridRow =
  { type: 'heading'; key: string; title: string } | { type: 'tiles'; key: string; items: Species[] };

export function herbariumRows(
  species: Species[],
  sort: HerbariumSort,
  language: string,
  otherFamily: string,
): GridRow[] {
  const collator = new Intl.Collator(language);
  const tiles = (items: Species[], prefix: string): GridRow[] =>
    Array.from({ length: Math.ceil(items.length / 3) }, (_, row) => ({
      type: 'tiles' as const,
      key: `${prefix}-${row}`,
      items: items.slice(row * 3, row * 3 + 3),
    }));

  if (sort === 'newest') return tiles(species, 'all');
  const byName = [...species].sort((a, b) => collator.compare(displayName(a), displayName(b)));
  if (sort === 'name') return tiles(byName, 'all');

  const families = new Map<string, Species[]>();
  for (const item of byName) {
    const family = item.family ?? otherFamily;
    families.set(family, [...(families.get(family) ?? []), item]);
  }
  return [...families.entries()]
    .sort(([a], [b]) => (a === otherFamily ? 1 : b === otherFamily ? -1 : collator.compare(a, b)))
    .flatMap(([family, items]) => [
      { type: 'heading' as const, key: `h-${family}`, title: family },
      ...tiles(items, family),
    ]);
}

/** Matches the search box against the common and scientific names. */
export function matchesSearch(species: Species, query: string) {
  const needle = query.toLocaleLowerCase();
  return [species.commonName, species.scientificName].some((name) => name?.toLocaleLowerCase().includes(needle));
}
