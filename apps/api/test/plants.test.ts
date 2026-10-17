import { eq, schema } from '@plantcare/db';
import { env } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { photoKey } from '../src/services/photos';
import { db, identifyForm, mockModel, monstera, signedInUser } from './helpers';

afterEach(() => vi.restoreAllMocks());

type Plants = {
  items: {
    id: string;
    name: string;
    wateringIntervalDays: number;
    lastWateredAt: string;
    nextWateringAt: string;
    imageUrl: string;
  }[];
};

async function identify(user: Awaited<ReturnType<typeof signedInUser>>) {
  const response = await user.request('/v1/identify', { method: 'POST', body: identifyForm() });
  return response.json<{ id: string }>();
}

function addPlant(user: Awaited<ReturnType<typeof signedInUser>>, body: object) {
  return user.request('/v1/plants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('plants', () => {
  it('adds an identification to My plants with the model’s watering interval, once', async () => {
    mockModel(monstera);
    const user = await signedInUser();
    const { id: identificationId } = await identify(user);

    const created = await addPlant(user, { identificationId });
    expect(created.status).toBe(201);
    const again = await addPlant(user, { identificationId });
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual(await created.json());

    const { items } = await (await user.request('/v1/plants')).json<Plants>();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ name: 'Monstera dziurawa', wateringIntervalDays: 8 });
    const next = new Date(items[0]!.nextWateringAt).getTime() - new Date(items[0]!.lastWateredAt).getTime();
    expect(next).toBe(8 * 24 * 60 * 60 * 1000);

    const detail = await (await user.request(`/v1/identifications/${identificationId}`)).json<{ plantId: string }>();
    expect(detail.plantId).toBe(items[0]!.id);
  });

  it('falls back to 7 days without an interval from the model, and accepts an explicit one', async () => {
    mockModel({ ...monstera, care: null });
    const user = await signedInUser();
    const first = await identify(user);
    const second = await identify(user);

    await addPlant(user, { identificationId: first.id });
    await addPlant(user, { identificationId: second.id, wateringIntervalDays: 3 });

    const { items } = await (await user.request('/v1/plants')).json<Plants>();
    // Soonest watering first.
    expect(items.map((item) => item.wateringIntervalDays)).toEqual([3, 7]);
  });

  it('waters, renames and changes the interval; rejects bad input and other users', async () => {
    mockModel(monstera);
    const user = await signedInUser();
    const other = await signedInUser();
    const { id: identificationId } = await identify(user);
    const { id } = await (await addPlant(user, { identificationId })).json<{ id: string }>();
    await db
      .update(schema.plant)
      .set({ lastWateredAt: new Date('2026-01-01T00:00:00Z') })
      .where(eq(schema.plant.id, id));

    expect((await user.request(`/v1/plants/${id}/water`, { method: 'POST' })).status).toBe(204);
    const patch = (who: typeof user, body: object) =>
      who.request(`/v1/plants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    expect((await patch(user, { name: 'Moja monstera', wateringIntervalDays: 10 })).status).toBe(204);
    expect((await patch(user, { wateringIntervalDays: 0 })).status).toBe(400);
    expect((await patch(user, {})).status).toBe(400);
    expect((await patch(other, { name: 'Hacked' })).status).toBe(404);
    expect((await other.request(`/v1/plants/${id}/water`, { method: 'POST' })).status).toBe(404);

    const { items } = await (await user.request('/v1/plants')).json<Plants>();
    expect(items[0]).toMatchObject({ name: 'Moja monstera', wateringIntervalDays: 10 });
    expect(Date.now() - new Date(items[0]!.lastWateredAt).getTime()).toBeLessThan(60_000);
    expect(await (await other.request('/v1/plants')).json()).toEqual({ items: [] });
  });

  it('keeps the shared photo until both the plant and the identification are gone', async () => {
    mockModel(monstera);
    const user = await signedInUser();
    const { id: identificationId } = await identify(user);
    const { id } = await (await addPlant(user, { identificationId })).json<{ id: string }>();
    const key = photoKey(user.id, identificationId);

    expect((await user.request(`/v1/identifications/${identificationId}`, { method: 'DELETE' })).status).toBe(204);
    expect(await env.PHOTOS.head(key)).not.toBeNull();
    const { items } = await (await user.request('/v1/plants')).json<Plants>();
    expect(items).toHaveLength(1);

    expect((await user.request(`/v1/plants/${id}`, { method: 'DELETE' })).status).toBe(204);
    expect(await env.PHOTOS.head(key)).toBeNull();
  });

  it('cannot add someone else’s identification', async () => {
    mockModel(monstera);
    const owner = await signedInUser();
    const other = await signedInUser();
    const { id: identificationId } = await identify(owner);
    expect((await addPlant(other, { identificationId })).status).toBe(404);
  });
});
