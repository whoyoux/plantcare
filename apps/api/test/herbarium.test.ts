import { describe, expect, it } from 'vitest';

import { identifyForm, mockModel, monstera, signedInUser } from './helpers';

type Herbarium = {
  speciesCount: number;
  familyCount: number;
  species: { key: string; count: number; imageUrl: string; photos: unknown[] }[];
  badges: { id: string; level: number; current: number; target: number; earnedAt: string | null }[];
  next: { id: string } | null;
};

type Identified = { herbarium: { newSpecies: boolean; speciesCount: number; newBadges: { id: string }[] } };

describe('herbarium', () => {
  it('requires a session', async () => {
    const { SELF } = await import('cloudflare:test');
    expect((await SELF.fetch('http://api.test/v1/herbarium')).status).toBe(401);
  });

  it('is empty at first, with First leaf as the next badge', async () => {
    const user = await signedInUser();
    const herbarium = await (await user.request('/v1/herbarium')).json<Herbarium>();
    expect(herbarium).toMatchObject({ speciesCount: 0, familyCount: 0, species: [], next: { id: 'firstLeaf' } });
  });

  it('celebrates a new species once, then groups repeat finds into one species', async () => {
    const user = await signedInUser();

    mockModel(monstera);
    const first = await (
      await user.request('/v1/identify', { method: 'POST', body: identifyForm() })
    ).json<Identified>();
    expect(first.herbarium).toEqual({
      newSpecies: true,
      speciesCount: 1,
      newBadges: [{ id: 'firstLeaf', level: 1, maxLevel: 1 }],
    });

    mockModel({ ...monstera, scientificName: 'monstera deliciosa' });
    const again = await (
      await user.request('/v1/identify', { method: 'POST', body: identifyForm() })
    ).json<Identified>();
    expect(again.herbarium).toEqual({ newSpecies: false, speciesCount: 1, newBadges: [] });

    const herbarium = await (await user.request('/v1/herbarium')).json<Herbarium>();
    expect(herbarium.speciesCount).toBe(1);
    expect(herbarium.familyCount).toBe(1);
    expect(herbarium.species[0]).toMatchObject({ key: 'monstera deliciosa', count: 2 });
    expect(herbarium.species[0]!.photos).toHaveLength(2);
    expect(herbarium.badges.find((badge) => badge.id === 'firstLeaf')).toMatchObject({ level: 1 });
  });

  it('only shows the signed-in user’s finds', async () => {
    const owner = await signedInUser();
    mockModel(monstera);
    await owner.request('/v1/identify', { method: 'POST', body: identifyForm() });

    const other = await signedInUser('Other');
    expect((await (await other.request('/v1/herbarium')).json<Herbarium>()).speciesCount).toBe(0);
  });
});
