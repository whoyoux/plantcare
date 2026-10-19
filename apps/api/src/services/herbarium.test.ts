import { describe, expect, it } from 'vitest';

import { buildHerbarium, newBadges, type HerbariumEntry } from './herbarium';

let seq = 0;
function entry(scientificName: string, overrides: Partial<HerbariumEntry> = {}): HerbariumEntry {
  seq += 1;
  return {
    id: `id-${seq}`,
    createdAt: new Date(Date.UTC(2026, 9, 1, 0, seq)),
    scientificName,
    commonName: null,
    family: null,
    confidence: 0.9,
    imageKey: `users/u/${seq}.jpg`,
    category: null,
    toxic: false,
    ...overrides,
  };
}

const badge = (herbarium: ReturnType<typeof buildHerbarium>, id: string) => herbarium.badges.find((b) => b.id === id)!;

describe('buildHerbarium', () => {
  it('groups identifications into species, case-insensitively, newest discovery first', () => {
    const first = entry('Monstera deliciosa', { confidence: 0.7, commonName: 'Monstera' });
    const second = entry('Mentha spicata');
    const again = entry('monstera deliciosa', { confidence: 0.95 });

    const { species } = buildHerbarium([first, second, again]);

    expect(species.map((item) => item.key)).toEqual(['mentha spicata', 'monstera deliciosa']);
    const monstera = species[1]!;
    expect(monstera).toMatchObject({ count: 2, commonName: 'Monstera', firstSeen: first.createdAt });
    expect(monstera.best.id).toBe(again.id);
    expect(monstera.entries.map((item) => item.id)).toEqual([again.id, first.id]);
  });

  it('marks genus-only names and counts families once', () => {
    const herbarium = buildHerbarium([
      entry('Mentha', { family: 'Lamiaceae' }),
      entry('Thymus vulgaris', { family: 'Lamiaceae' }),
      entry('Ficus elastica', { family: 'Moraceae' }),
    ]);
    expect(herbarium.species.find((item) => item.key === 'mentha')?.genusOnly).toBe(true);
    expect(herbarium.familyCount).toBe(2);
  });

  it('levels up Collector and dates each level by the species that reached it', () => {
    const entries = Array.from({ length: 26 }, (_, index) => entry(`Plantus species${index}`));
    const collector = badge(buildHerbarium(entries), 'collector');

    expect(collector).toMatchObject({ level: 2, maxLevel: 4, current: 26, target: 50 });
    expect(collector.earnedAt).toEqual(entries[24]!.createdAt);
    expect(badge(buildHerbarium(entries), 'firstLeaf')).toMatchObject({ level: 1, earnedAt: entries[0]!.createdAt });
  });

  it('counts themed badges by category and flags toxic plants', () => {
    const herbs = ['Mentha spicata', 'Thymus vulgaris', 'Salvia officinalis', 'Ocimum basilicum', 'Origanum vulgare'];
    const herbarium = buildHerbarium([
      ...herbs.map((name) => entry(name, { category: 'herb' })),
      entry('Hedera helix', { toxic: true, category: 'other' }),
    ]);
    expect(badge(herbarium, 'herbalist')).toMatchObject({ level: 1, current: 5 });
    expect(badge(herbarium, 'forester')).toMatchObject({ level: 0, current: 0, target: 5 });
    expect(badge(herbarium, 'careful')).toMatchObject({ level: 1 });
  });

  it('earns Look-alikes once both halves of a pair are found', () => {
    const mint = entry('Mentha × piperita');
    expect(badge(buildHerbarium([mint]), 'lookalikes').level).toBe(0);

    const balm = entry('Melissa officinalis');
    expect(badge(buildHerbarium([mint, balm]), 'lookalikes')).toMatchObject({ level: 1, earnedAt: balm.createdAt });
  });

  it('counts plants for Caretaker and picks the closest unfinished badge as next', () => {
    const plants = Array.from({ length: 5 }, (_, day) => new Date(Date.UTC(2026, 9, day + 1)));
    const herbarium = buildHerbarium(
      Array.from({ length: 9 }, (_, index) => entry(`Plantus next${index}`)),
      plants,
    );
    expect(badge(herbarium, 'caretaker')).toMatchObject({ level: 1, earnedAt: plants[4] });
    expect(herbarium.next).toMatchObject({ id: 'collector', current: 9, target: 10 });
  });

  it('reports badges that levelled up between two states', () => {
    const before = buildHerbarium([]);
    const after = buildHerbarium([entry('Monstera deliciosa')]);
    expect(newBadges(before, after)).toEqual([{ id: 'firstLeaf', level: 1, maxLevel: 1 }]);
    expect(newBadges(after, after)).toEqual([]);
  });
});
