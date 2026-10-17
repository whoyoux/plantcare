import { and, asc, eq, schema, sql } from '@plantcare/db';
import type { Identification } from '@plantcare/shared';
import { z } from 'zod';

import { factory } from '../../env';
import { AppError } from '../../errors';
import { requireUser } from '../../middleware/require-user';
import { validate } from '../../validation';

const table = schema.plant;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Used when the model gave no watering interval (older results, or not a potted plant). */
const DEFAULT_INTERVAL_DAYS = 7;

const Interval = z.number().int().min(1).max(60);
const IdParam = z.object({ id: z.uuid() });

type PlantRow = typeof table.$inferSelect;

export const plantRoutes = factory
  .createApp()
  .use(requireUser)
  /** The user's plants, the ones that need water soonest first. */
  .get('/', async (c) => {
    const rows = await c.var.db
      .select()
      .from(table)
      .where(eq(table.userId, c.var.user.id))
      .orderBy(asc(sql`${table.lastWateredAt} + make_interval(days => ${table.wateringIntervalDays})`));
    const sign = (row: PlantRow) => c.var.photoUrls.sign(row.imageKey);
    const items = await Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        identificationId: row.identificationId,
        name: row.name,
        scientificName: row.scientificName,
        wateringIntervalDays: row.wateringIntervalDays,
        lastWateredAt: row.lastWateredAt.toISOString(),
        nextWateringAt: new Date(row.lastWateredAt.getTime() + row.wateringIntervalDays * DAY_MS).toISOString(),
        imageUrl: await sign(row),
      })),
    );
    return c.json({ items });
  })
  /** Adds an identification to My plants. Adding the same identification twice returns the existing plant. */
  .post(
    '/',
    validate('json', z.object({ identificationId: z.uuid(), wateringIntervalDays: Interval.optional() })),
    async (c) => {
      const { identificationId, wateringIntervalDays } = c.req.valid('json');
      const userId = c.var.user.id;

      const [existing] = await c.var.db
        .select({ id: table.id })
        .from(table)
        .where(and(eq(table.userId, userId), eq(table.identificationId, identificationId)))
        .limit(1);
      if (existing) return c.json({ id: existing.id }, 200);

      const [identification] = await c.var.db
        .select()
        .from(schema.identification)
        .where(and(eq(schema.identification.id, identificationId), eq(schema.identification.userId, userId)));
      if (!identification) throw new AppError('NOT_FOUND', 404);

      const result = identification.result as Identification;
      const [plant] = await c.var.db
        .insert(table)
        .values({
          userId,
          identificationId,
          imageKey: identification.imageKey,
          name: identification.commonName ?? identification.scientificName,
          scientificName: identification.scientificName,
          wateringIntervalDays: wateringIntervalDays ?? result.care?.wateringDays ?? DEFAULT_INTERVAL_DAYS,
          lastWateredAt: new Date(),
        })
        .returning({ id: table.id });
      return c.json({ id: plant!.id }, 201);
    },
  )
  .patch(
    '/:id',
    validate('param', IdParam),
    validate(
      'json',
      z
        .object({ name: z.string().trim().min(1).max(80).optional(), wateringIntervalDays: Interval.optional() })
        .refine((body) => Object.keys(body).length > 0),
    ),
    async (c) => {
      const [row] = await c.var.db
        .update(table)
        .set(c.req.valid('json'))
        .where(and(eq(table.id, c.req.valid('param').id), eq(table.userId, c.var.user.id)))
        .returning({ id: table.id });
      if (!row) throw new AppError('NOT_FOUND', 404);
      return c.body(null, 204);
    },
  )
  /** Marks the plant as watered now, which starts its next interval. */
  .post('/:id/water', validate('param', IdParam), async (c) => {
    const [row] = await c.var.db
      .update(table)
      .set({ lastWateredAt: new Date() })
      .where(and(eq(table.id, c.req.valid('param').id), eq(table.userId, c.var.user.id)))
      .returning({ id: table.id });
    if (!row) throw new AppError('NOT_FOUND', 404);
    return c.body(null, 204);
  })
  .delete('/:id', validate('param', IdParam), async (c) => {
    const [row] = await c.var.db
      .delete(table)
      .where(and(eq(table.id, c.req.valid('param').id), eq(table.userId, c.var.user.id)))
      .returning({ imageKey: table.imageKey });
    if (!row) throw new AppError('NOT_FOUND', 404);
    // The identification in History may still show this photo.
    await c.var.photos.deleteIfUnused(c.var.user.id, row.imageKey);
    return c.body(null, 204);
  });
