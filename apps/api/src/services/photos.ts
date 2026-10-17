import { and, eq, schema, type Database } from '@plantcare/db';

/** R2's delete() accepts at most 1000 keys per call. */
const R2_DELETE_LIMIT = 1000;

/** Where a user's photo lives in R2. Everything a user uploads sits under their own prefix. */
export function photoKey(userId: string, photoId: string) {
  return `users/${userId}/${photoId}.jpg`;
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += size) chunks.push(items.slice(start, start + size));
  return chunks;
}

/** Photo storage. The database is the source of truth for which objects exist. */
export function createPhotos(deps: { db: Database; bucket: R2Bucket }) {
  return {
    async save(userId: string, photoId: string, photo: Uint8Array) {
      const key = photoKey(userId, photoId);
      await deps.bucket.put(key, photo, { httpMetadata: { contentType: 'image/jpeg' } });
      return key;
    },

    async get(key: string) {
      return deps.bucket.get(key);
    },

    async delete(key: string) {
      await deps.bucket.delete(key);
    },

    /**
     * Deletes a photo unless an identification or a plant of this user still points at it
     * (a plant keeps the photo of the identification it was created from).
     */
    async deleteIfUnused(userId: string, key: string) {
      const [identification] = await deps.db
        .select({ id: schema.identification.id })
        .from(schema.identification)
        .where(and(eq(schema.identification.userId, userId), eq(schema.identification.imageKey, key)))
        .limit(1);
      const [plant] = await deps.db
        .select({ id: schema.plant.id })
        .from(schema.plant)
        .where(and(eq(schema.plant.userId, userId), eq(schema.plant.imageKey, key)))
        .limit(1);
      if (!identification && !plant) await deps.bucket.delete(key);
    },

    /** Deletes every photo referenced by the user's identifications and plants. */
    async deleteAllForUser(userId: string) {
      const identifications = await deps.db
        .select({ key: schema.identification.imageKey })
        .from(schema.identification)
        .where(eq(schema.identification.userId, userId));
      const plants = await deps.db
        .select({ key: schema.plant.imageKey })
        .from(schema.plant)
        .where(eq(schema.plant.userId, userId));
      const keys = [...new Set([...identifications, ...plants].map((row) => row.key))];
      for (const batch of chunk(keys, R2_DELETE_LIMIT)) await deps.bucket.delete(batch);
    },
  };
}

export type Photos = ReturnType<typeof createPhotos>;
