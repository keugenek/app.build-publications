import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { photosTable } from '../db/schema';
import { type Photo } from '../schema';
import { getPhotos } from '../handlers/get_photos';

/** Helper to insert a photo directly via db */
const insertPhoto = async (data: {
  url: string;
  caption?: string | null;
  order: number;
}): Promise<Photo> => {
  const [record] = await db
    .insert(photosTable)
    .values({
      url: data.url,
      caption: data.caption ?? null,
      order: data.order,
    })
    .returning()
    .execute();
  return record;
};

describe('getPhotos handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no photos exist', async () => {
    const result = await getPhotos();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should return all photos ordered by `order` ascending', async () => {
    // Insert out‑of‑order records directly
    const photoA = await insertPhoto({
      url: 'https://example.com/a.jpg',
      caption: 'A caption',
      order: 2,
    });
    const photoB = await insertPhoto({
      url: 'https://example.com/b.jpg',
      caption: null,
      order: 1,
    });

    const photos = await getPhotos();
    expect(photos).toHaveLength(2);
    // Order should be by `order` ascending => B then A
    expect(photos[0].id).toBe(photoB.id);
    expect(photos[1].id).toBe(photoA.id);
    // Verify type conversions
    expect(typeof photos[0].order).toBe('number');
    expect(photos[0].created_at).toBeInstanceOf(Date);
  });
});
