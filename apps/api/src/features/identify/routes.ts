import { and, count, eq, gte, schema } from '@plantcare/db';
import { LANGUAGES } from '@plantcare/shared';
import { z } from 'zod';

import { DAILY_IDENTIFICATIONS, IDENTIFY_MODEL } from '../../config';
import { factory } from '../../env';
import { AppError } from '../../errors';
import { requireUser } from '../../middleware/require-user';
import { createPhotos } from '../../services/photos';
import { createPlantIdentifier } from '../../services/plant-identifier';

/** The app downsizes photos to ~1024 px before upload; anything bigger is not from the app. */
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

const form = z.object({
  photo: z.instanceof(File),
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

    const parsed = form.safeParse(await c.req.parseBody());
    if (!parsed.success) throw new AppError('INVALID_REQUEST', 400);
    const { photo, language } = parsed.data;
    if (photo.size > MAX_PHOTO_BYTES) throw new AppError('PHOTO_TOO_LARGE', 413);
    const bytes = new Uint8Array(await photo.arrayBuffer());
    if (!isJpeg(bytes)) throw new AppError('INVALID_PHOTO', 415);

    // Burst protection per user, then the daily allowance (rolling 24 h).
    const { success } = await c.env.IDENTIFY_RATE_LIMIT.limit({ key: user.id });
    if (!success) throw new AppError('RATE_LIMITED', 429);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [today] = await c.var.db
      .select({ value: count() })
      .from(schema.identification)
      .where(and(eq(schema.identification.userId, user.id), gte(schema.identification.createdAt, since)));
    if ((today?.value ?? 0) >= DAILY_IDENTIFICATIONS) throw new AppError('DAILY_LIMIT_REACHED', 429);

    const identifier = createPlantIdentifier({
      baseUrl: `https://gateway.ai.cloudflare.com/v1/${c.env.CLOUDFLARE_ACCOUNT_ID}/${c.env.AI_GATEWAY_ID}/openrouter/v1`,
      apiKey: c.env.OPENROUTER_API_KEY,
      config: IDENTIFY_MODEL,
    });
    const result = await identifier.identify(bytes, language);
    // Nothing is stored for photos without a plant.
    if (!result.isPlant || !result.scientificName) throw new AppError('NOT_A_PLANT', 422);

    const id = crypto.randomUUID();
    const imageKey = await createPhotos({ db: c.var.db, bucket: c.env.PHOTOS }).save(user.id, id, bytes);
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
      })
      .returning({ id: schema.identification.id, createdAt: schema.identification.createdAt });

    return c.json({ id: row!.id, createdAt: row!.createdAt.toISOString(), language, result }, 201);
  });
