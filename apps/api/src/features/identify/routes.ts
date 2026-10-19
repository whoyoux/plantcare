import { and, count, eq, gte, lt, schema } from '@plantcare/db';
import { LANGUAGES } from '@plantcare/shared';
import { z } from 'zod';

import { DAILY_IDENTIFICATIONS, IDENTIFY_MODEL, OPENROUTER_URL } from '../../config';
import { factory } from '../../env';
import { AppError } from '../../errors';
import { requireUser } from '../../middleware/require-user';
import { buildHerbarium, newBadges } from '../../services/herbarium';
import { createPlantIdentifier } from '../../services/plant-identifier';
import { loadHerbariumData } from '../herbarium/routes';

/** The app downsizes photos to ~1024 px before upload; anything bigger is not from the app. */
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
/** Up to three photos of one plant (say a leaf, a flower and the whole plant) for one answer. */
const MAX_PHOTOS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const form = z.object({
  // One `photo` field per photo; a single one arrives as a File, several as an array.
  photo: z
    .union([z.instanceof(File), z.array(z.instanceof(File)).min(1).max(MAX_PHOTOS)])
    .transform((value) => (Array.isArray(value) ? value : [value])),
  language: z.enum(LANGUAGES),
});

function isJpeg(bytes: Uint8Array) {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export const identifyRoutes = factory
  .createApp()
  .use(requireUser)
  .post('/', async (c) => {
    const user = c.var.user;

    // Refuse oversized uploads before reading them (the multipart envelope adds a little).
    if (Number(c.req.header('content-length') ?? 0) > MAX_PHOTOS * MAX_PHOTO_BYTES + 64 * 1024) {
      throw new AppError('PHOTO_TOO_LARGE', 413);
    }
    const parsed = form.safeParse(await c.req.parseBody({ all: true }));
    if (!parsed.success) throw new AppError('INVALID_REQUEST', 400);
    const { language } = parsed.data;
    if (parsed.data.photo.some((photo) => photo.size > MAX_PHOTO_BYTES)) throw new AppError('PHOTO_TOO_LARGE', 413);
    const photos = await Promise.all(parsed.data.photo.map(async (photo) => new Uint8Array(await photo.arrayBuffer())));
    if (!photos.every(isJpeg)) throw new AppError('INVALID_PHOTO', 415);

    // Burst protection per user, then the daily allowance (rolling 24 h). Every model call counts,
    // including photos without a plant: each one costs the same.
    const { success } = await c.env.IDENTIFY_RATE_LIMIT.limit({ key: user.id });
    if (!success) throw new AppError('RATE_LIMITED', 429);
    const global = await c.env.IDENTIFY_GLOBAL_RATE_LIMIT.limit({ key: 'all' });
    if (!global.success) throw new AppError('RATE_LIMITED', 429);
    const since = new Date(Date.now() - DAY_MS);
    const attempts = schema.identifyAttempt;
    const [today] = await c.var.db
      .select({ value: count() })
      .from(attempts)
      .where(and(eq(attempts.userId, user.id), gte(attempts.createdAt, since)));
    if ((today?.value ?? 0) >= DAILY_IDENTIFICATIONS) throw new AppError('DAILY_LIMIT_REACHED', 429);
    await c.var.db.insert(attempts).values({ userId: user.id });
    // Only the last 24 h matter; drop this user's older attempts so the table stays small.
    await c.var.db
      .delete(attempts)
      .where(and(eq(attempts.userId, user.id), lt(attempts.createdAt, new Date(Date.now() - 2 * DAY_MS))));

    const identifier = createPlantIdentifier({
      baseUrl: OPENROUTER_URL,
      apiKey: c.env.OPENROUTER_API_KEY,
      config: IDENTIFY_MODEL,
    });
    const result = await identifier.identify(photos, language);
    // Nothing is stored for photos without a plant.
    if (!result.isPlant || !result.scientificName) throw new AppError('NOT_A_PLANT', 422);

    // The collection before this find, to tell the app about a new species or badge.
    const { entries, plantDates } = await loadHerbariumData(c.var.db, user.id);
    const before = buildHerbarium(entries, plantDates);

    const id = crypto.randomUUID();
    // The first photo is the one kept in history; the others only help the model.
    const imageKey = await c.var.photos.save(user.id, id, photos[0]!);
    const [row] = await c.var.db
      .insert(schema.identification)
      .values({
        id,
        userId: user.id,
        imageKey,
        language,
        scientificName: result.scientificName,
        commonName: result.commonName,
        confidence: result.confidence,
        model: identifier.model,
        result,
        // Millisecond precision (like JS dates), so history cursors compare exactly.
        createdAt: new Date(),
      })
      .returning({ id: schema.identification.id, createdAt: schema.identification.createdAt });

    const toxicity = result.toxicity;
    const after = buildHerbarium(
      [
        ...entries,
        {
          id,
          createdAt: row!.createdAt,
          scientificName: result.scientificName,
          commonName: result.commonName,
          family: result.family,
          confidence: result.confidence,
          imageKey,
          category: result.category,
          toxic: toxicity ? [toxicity.cats, toxicity.dogs, toxicity.people].includes('toxic') : false,
        },
      ],
      plantDates,
    );
    const key = result.scientificName.trim().toLowerCase();

    return c.json(
      {
        id: row!.id,
        createdAt: row!.createdAt.toISOString(),
        language,
        result,
        imageUrl: await c.var.photoUrls.sign(imageKey),
        herbarium: {
          /** First time this species was found. */
          newSpecies: !before.species.some((item) => item.key === key),
          /** Its number in the collection (species found so far). */
          speciesCount: after.species.length,
          newBadges: newBadges(before, after),
        },
      },
      201,
    );
  });
