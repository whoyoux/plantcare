import type { Database } from '@plantcare/db';
import { describe, expect, it, vi } from 'vitest';

import { chunk, createPhotos, photoKey } from './photos';

describe('photoKey', () => {
  it('keeps every photo under the owner prefix', () => {
    expect(photoKey('user-1', 'photo-1')).toBe('users/user-1/photo-1.jpg');
  });
});

describe('chunk', () => {
  it('splits into batches of the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 2)).toEqual([]);
  });
});

describe('deleteAllForUser', () => {
  /** Just enough of Drizzle's select builder: select().from().where() resolves to the rows. */
  function fakeDb(keys: string[]) {
    const where = vi.fn().mockResolvedValue(keys.map((key) => ({ key })));
    return { db: { select: () => ({ from: () => ({ where }) }) } as unknown as Database, where };
  }

  it('deletes the user photos in batches of 1000', async () => {
    const keys = Array.from({ length: 2500 }, (_, i) => photoKey('user-1', `p${i}`));
    const { db } = fakeDb(keys);
    const bucket = { delete: vi.fn<(keys: string[]) => Promise<void>>().mockResolvedValue(undefined) };

    await createPhotos({ db, bucket: bucket as unknown as R2Bucket }).deleteAllForUser('user-1');

    expect(bucket.delete.mock.calls.map(([batch]) => batch.length)).toEqual([1000, 1000, 500]);
    expect(bucket.delete.mock.calls.flatMap(([batch]) => batch)).toEqual(keys);
  });

  it('does not call R2 when the user has no photos', async () => {
    const { db } = fakeDb([]);
    const bucket = { delete: vi.fn() };

    await createPhotos({ db, bucket: bucket as unknown as R2Bucket }).deleteAllForUser('user-1');

    expect(bucket.delete).not.toHaveBeenCalled();
  });
});
