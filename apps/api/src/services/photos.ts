import { eq, schema, type Database } from '@plantcare/db';

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
    /** Deletes every photo referenced by the user's identifications. */
    async deleteAllForUser(userId: string) {
      const rows = await deps.db
        .select({ key: schema.identification.imageKey })
        .from(schema.identification)
        .where(eq(schema.identification.userId, userId));
      const keys = rows.map((row) => row.key);
      for (const batch of chunk(keys, R2_DELETE_LIMIT)) await deps.bucket.delete(batch);
    },
  };
}

export type Photos = ReturnType<typeof createPhotos>;
