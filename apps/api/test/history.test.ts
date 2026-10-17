import { eq, schema } from '@plantcare/db';
import { env, SELF } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { photoKey } from '../src/services/photos';
import { db, identifyForm, mockModel, monstera, signedInUser } from './helpers';

afterEach(() => vi.restoreAllMocks());

type Page = { items: { id: string; commonName: string | null; imageUrl: string }[]; nextCursor: string | null };

/** Saves identifications directly, oldest first, one second apart. */
async function seed(userId: string, names: string[]) {
  const start = Date.now() - names.length * 1000;
  return db
    .insert(schema.identification)
    .values(
      names.map((name, index) => ({
        userId,
        imageKey: photoKey(userId, `seed-${index}`),
        language: 'pl',
        scientificName: `Plantus ${name.toLowerCase()}`,
        commonName: name,
        confidence: 0.9,
        model: 'test',
        result: { ...monstera, commonName: name },
        createdAt: new Date(start + index * 1000),
      })),
    )
    .returning({ id: schema.identification.id });
}

describe('history', () => {
  it('lists only the signed-in user’s identifications, newest first, in pages of 30', async () => {
    const user = await signedInUser();
    const other = await signedInUser();
    await seed(other.id, ['Foreign']);
    await seed(
      user.id,
      Array.from({ length: 35 }, (_, i) => `Plant ${String(i).padStart(2, '0')}`),
    );

    const first = await (await user.request('/v1/identifications')).json<Page>();
    expect(first.items).toHaveLength(30);
    expect(first.items[0]!.commonName).toBe('Plant 34');
    expect(first.nextCursor).not.toBeNull();

    const second = await (
      await user.request(`/v1/identifications?cursor=${encodeURIComponent(first.nextCursor!)}`)
    ).json<Page>();
    expect(second.items.map((item) => item.commonName)).toEqual([
      'Plant 04',
      'Plant 03',
      'Plant 02',
      'Plant 01',
      'Plant 00',
    ]);
    expect(second.nextCursor).toBeNull();
  });

  it('searches common and scientific names', async () => {
    const user = await signedInUser();
    await seed(user.id, ['Monstera', 'Paproć', 'Fikus']);

    const byCommon = await (await user.request('/v1/identifications?q=papro')).json<Page>();
    expect(byCommon.items.map((item) => item.commonName)).toEqual(['Paproć']);
    const byScientific = await (await user.request('/v1/identifications?q=PLANTUS%20FIK')).json<Page>();
    expect(byScientific.items.map((item) => item.commonName)).toEqual(['Fikus']);
    const wildcard = await (await user.request('/v1/identifications?q=%25')).json<Page>();
    expect(wildcard.items).toEqual([]);
  });

  it('rejects a malformed cursor', async () => {
    const user = await signedInUser();
    const response = await user.request('/v1/identifications?cursor=nope');
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ code: 'INVALID_CURSOR' });
  });

  it('shows and deletes an identification with its photo, but not someone else’s', async () => {
    mockModel(monstera);
    const user = await signedInUser();
    const other = await signedInUser();
    const created = await (
      await user.request('/v1/identify', { method: 'POST', body: identifyForm() })
    ).json<{
      id: string;
    }>();

    expect((await other.request(`/v1/identifications/${created.id}`)).status).toBe(404);
    expect((await other.request(`/v1/identifications/${created.id}`, { method: 'DELETE' })).status).toBe(404);

    const detail = await (await user.request(`/v1/identifications/${created.id}`)).json<{ result: unknown }>();
    expect(detail.result).toEqual(monstera);

    expect((await user.request(`/v1/identifications/${created.id}`, { method: 'DELETE' })).status).toBe(204);
    expect((await user.request(`/v1/identifications/${created.id}`)).status).toBe(404);
    expect(await env.PHOTOS.head(photoKey(user.id, created.id))).toBeNull();
  });

  it('serves photos only through valid signed links', async () => {
    mockModel(monstera);
    const user = await signedInUser();
    const { imageUrl } = await (
      await user.request('/v1/identify', { method: 'POST', body: identifyForm() })
    ).json<{
      imageUrl: string;
    }>();

    // No session needed: the signature is the permission.
    const photo = await SELF.fetch(imageUrl);
    expect(photo.status).toBe(200);
    expect(photo.headers.get('Content-Type')).toBe('image/jpeg');
    expect(new Uint8Array(await photo.arrayBuffer()).slice(0, 3)).toEqual(new Uint8Array([0xff, 0xd8, 0xff]));

    const tampered = imageUrl.replace(/signature=[0-9a-f]/, 'signature=x');
    expect((await SELF.fetch(tampered)).status).toBe(404);
    const otherKey = imageUrl.replace(`users/${user.id}`, 'users/someone-else');
    expect((await SELF.fetch(otherKey)).status).toBe(404);
  });

  it('removes photos and history when the account is deleted', async () => {
    mockModel(monstera);
    const user = await signedInUser();
    const { id } = await (
      await user.request('/v1/identify', { method: 'POST', body: identifyForm() })
    ).json<{
      id: string;
    }>();

    const response = await user.request('/api/auth/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'plantcare-dev://' },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(200);

    expect(await db.select().from(schema.user).where(eq(schema.user.id, user.id))).toEqual([]);
    expect(await db.select().from(schema.identification).where(eq(schema.identification.userId, user.id))).toEqual([]);
    expect(await env.PHOTOS.head(photoKey(user.id, id))).toBeNull();
  });
});

describe('GET /v1/identifications/stats', () => {
  it('counts identifications, distinct species and the last 7 days, for this user only', async () => {
    const user = await signedInUser();
    const other = await signedInUser();
    await seed(other.id, ['Foreign']);
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    await db.insert(schema.identification).values({
      userId: user.id,
      imageKey: photoKey(user.id, 'old'),
      language: 'pl',
      scientificName: 'Plantus monstera',
      commonName: 'Monstera',
      confidence: 0.9,
      model: 'test',
      result: monstera,
      createdAt: old,
    });
    // Two more Monsteras (same species) and one fern this week.
    await seed(user.id, ['Monstera', 'Monstera', 'Paproć']);

    const response = await user.request('/v1/identifications/stats');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 4, species: 2, thisWeek: 3 });
  });

  it('is all zeros for a new user', async () => {
    const user = await signedInUser();
    expect(await (await user.request('/v1/identifications/stats')).json()).toEqual({
      total: 0,
      species: 0,
      thisWeek: 0,
    });
  });
});
