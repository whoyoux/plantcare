import { and, count, countDistinct, desc, eq, ilike, or, schema, sql } from '@plantcare/db';
import type { Identification } from '@plantcare/shared';
import { z } from 'zod';

import { factory } from '../../env';
import { AppError } from '../../errors';
import { requireUser } from '../../middleware/require-user';
import { validate } from '../../validation';

const PAGE_SIZE = 30;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const table = schema.identification;

/** Opaque cursor: the last row's creation time and id (rows are ordered by both). */
const Cursor = z.object({ createdAt: z.iso.datetime(), id: z.uuid() });

function encodeCursor(row: { createdAt: Date; id: string }) {
  return btoa(JSON.stringify({ createdAt: row.createdAt.toISOString(), id: row.id }));
}

function decodeCursor(cursor: string) {
  try {
    return Cursor.parse(JSON.parse(atob(cursor)));
  } catch {
    throw new AppError('INVALID_CURSOR', 400);
  }
}

/** `%` and `_` are wildcards in LIKE; search for them literally. */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, (char) => `\\${char}`);

export const identificationRoutes = factory
  .createApp()
  .use(requireUser)
  /** The user's identifications, newest first. `q` filters by common or scientific name. */
  .get(
    '/',
    validate('query', z.object({ cursor: z.string().optional(), q: z.string().trim().max(100).optional() })),
    async (c) => {
      const { cursor, q } = c.req.valid('query');
      const after = cursor ? decodeCursor(cursor) : undefined;
      const rows = await c.var.db
        .select({
          id: table.id,
          createdAt: table.createdAt,
          scientificName: table.scientificName,
          commonName: table.commonName,
          confidence: table.confidence,
          imageKey: table.imageKey,
        })
        .from(table)
        .where(
          and(
            eq(table.userId, c.var.user.id),
            after && sql`(${table.createdAt}, ${table.id}) < (${after.createdAt}::timestamptz, ${after.id}::uuid)`,
            q
              ? or(ilike(table.commonName, `%${escapeLike(q)}%`), ilike(table.scientificName, `%${escapeLike(q)}%`))
              : undefined,
          ),
        )
        .orderBy(desc(table.createdAt), desc(table.id))
        .limit(PAGE_SIZE + 1);

      const page = rows.slice(0, PAGE_SIZE);
      const items = await Promise.all(
        page.map(async ({ imageKey, createdAt, ...row }) => ({
          ...row,
          createdAt: createdAt.toISOString(),
          imageUrl: await c.var.photoUrls.sign(imageKey),
        })),
      );
      const last = page.at(-1);
      return c.json({ items, nextCursor: rows.length > PAGE_SIZE && last ? encodeCursor(last) : null });
    },
  )
  /** Collection numbers for the home screen: identifications, distinct species, last 7 days. */
  .get('/stats', async (c) => {
    // Raw SQL parameters must be strings: the Workers postgres driver doesn't serialize Dates there.
    const weekAgo = new Date(Date.now() - WEEK_MS).toISOString();
    const [stats] = await c.var.db
      .select({
        total: count(),
        species: countDistinct(table.scientificName),
        thisWeek: sql<number>`count(*) filter (where ${table.createdAt} >= ${weekAgo}::timestamptz)`.mapWith(Number),
      })
      .from(table)
      .where(eq(table.userId, c.var.user.id));
    return c.json({ total: stats?.total ?? 0, species: stats?.species ?? 0, thisWeek: stats?.thisWeek ?? 0 });
  })
  .get('/:id', validate('param', z.object({ id: z.uuid() })), async (c) => {
    const [row] = await c.var.db
      .select()
      .from(table)
      .where(and(eq(table.id, c.req.valid('param').id), eq(table.userId, c.var.user.id)));
    if (!row) throw new AppError('NOT_FOUND', 404);
    const [plant] = await c.var.db
      .select({ id: schema.plant.id })
      .from(schema.plant)
      .where(and(eq(schema.plant.identificationId, row.id), eq(schema.plant.userId, c.var.user.id)))
      .limit(1);
    return c.json({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      language: row.language,
      result: row.result as Identification,
      imageUrl: await c.var.photoUrls.sign(row.imageKey),
      /** Set when this identification was added to My plants. */
      plantId: plant?.id ?? null,
    });
  })
  .delete('/:id', validate('param', z.object({ id: z.uuid() })), async (c) => {
    const [row] = await c.var.db
      .delete(table)
      .where(and(eq(table.id, c.req.valid('param').id), eq(table.userId, c.var.user.id)))
      .returning({ imageKey: table.imageKey });
    if (!row) throw new AppError('NOT_FOUND', 404);
    // A plant created from this identification keeps using the photo.
    await c.var.photos.deleteIfUnused(c.var.user.id, row.imageKey);
    return c.body(null, 204);
  });
