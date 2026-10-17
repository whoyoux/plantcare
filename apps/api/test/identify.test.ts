import { eq, schema } from '@plantcare/db';
import { env, SELF } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { photoKey } from '../src/services/photos';
import { db, identifyForm, mockModel, modelCalls, monstera, signedInUser, urlOf } from './helpers';

afterEach(() => vi.restoreAllMocks());

describe('POST /v1/identify', () => {
  it('requires a session', async () => {
    const response = await SELF.fetch('http://api.test/v1/identify', { method: 'POST', body: identifyForm() });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ code: 'UNAUTHORIZED' });
  });

  it('identifies the plant, stores the photo and the result, and returns a photo link', async () => {
    const model = mockModel(monstera);
    const user = await signedInUser();

    const response = await user.request('/v1/identify', { method: 'POST', body: identifyForm() });

    expect(response.status).toBe(201);
    const body = await response.json<{ id: string; language: string; result: unknown; imageUrl: string }>();
    expect(body.result).toEqual(monstera);
    expect(body.language).toBe('pl');
    expect(body.imageUrl).toMatch(`http://api.test/v1/photos/users/${user.id}/${body.id}.jpg?`);

    // The model got the Polish prompt through the stage's AI Gateway.
    const [url, init] = modelCalls(model)[0]!;
    expect(urlOf(url)).toBe(
      'https://gateway.ai.cloudflare.com/v1/account/plantcare-test/openrouter/v1/chat/completions',
    );
    expect(init?.body).toContain('Polish');

    const [row] = await db.select().from(schema.identification).where(eq(schema.identification.id, body.id));
    expect(row).toMatchObject({
      userId: user.id,
      scientificName: 'Monstera deliciosa',
      imageKey: photoKey(user.id, body.id),
    });
    expect(await env.PHOTOS.head(photoKey(user.id, body.id))).not.toBeNull();
  });

  it('stores nothing when the photo shows no plant', async () => {
    mockModel({ ...monstera, isPlant: false, scientificName: null, commonName: null, care: null, alternatives: [] });
    const user = await signedInUser();

    const response = await user.request('/v1/identify', { method: 'POST', body: identifyForm() });

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ code: 'NOT_A_PLANT' });
    expect(await db.select().from(schema.identification).where(eq(schema.identification.userId, user.id))).toEqual([]);
  });

  it('rejects files that are not JPEGs and unknown languages', async () => {
    const model = mockModel(monstera);
    const user = await signedInUser();

    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'photo.png', { type: 'image/png' });
    expect((await user.request('/v1/identify', { method: 'POST', body: identifyForm(png) })).status).toBe(415);
    expect((await user.request('/v1/identify', { method: 'POST', body: identifyForm(undefined, 'de') })).status).toBe(
      400,
    );
    expect(modelCalls(model)).toEqual([]);
  });

  it('enforces the daily allowance', async () => {
    mockModel(monstera);
    const user = await signedInUser();
    await db.insert(schema.identification).values(
      Array.from({ length: 30 }, () => ({
        userId: user.id,
        imageKey: 'users/x/y.jpg',
        language: 'pl',
        scientificName: 'Monstera deliciosa',
        commonName: null,
        confidence: 0.9,
        model: 'test',
        result: monstera,
      })),
    );

    const response = await user.request('/v1/identify', { method: 'POST', body: identifyForm() });
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ code: 'DAILY_LIMIT_REACHED' });
  });

  it('limits bursts per user', async () => {
    mockModel(monstera);
    const user = await signedInUser();

    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      statuses.push((await user.request('/v1/identify', { method: 'POST', body: identifyForm() })).status);
    }
    expect(statuses.slice(0, 6)).toEqual([201, 201, 201, 201, 201, 201]);
    expect(statuses[6]).toBe(429);
  });
});
