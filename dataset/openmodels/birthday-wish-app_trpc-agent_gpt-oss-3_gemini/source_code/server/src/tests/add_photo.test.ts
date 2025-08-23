import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { photosTable } from '../db/schema';
import { type AddPhotoInput } from '../schema';
import { addPhoto } from '../handlers/add_photo';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: AddPhotoInput = {
  url: 'https://example.com/photo.jpg',
  caption: 'A sample photo',
  order: 1,
};

describe('addPhoto', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a photo and return the record', async () => {
    const result = await addPhoto(testInput);
    expect(result.id).toBeDefined();
    expect(result.url).toBe(testInput.url);
    expect(result.caption).toBe(testInput.caption ?? null);
    expect(result.order).toBe(testInput.order);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the photo in the database', async () => {
    const result = await addPhoto(testInput);
    const rows = await db.select().from(photosTable).where(eq(photosTable.id, result.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.url).toBe(testInput.url);
    expect(row.caption).toBe(testInput.caption ?? null);
    expect(row.order).toBe(testInput.order);
    expect(row.created_at).toBeInstanceOf(Date);
  });

  it('should handle null caption correctly', async () => {
    const input: AddPhotoInput = {
      url: 'https://example.com/another.jpg',
      caption: null,
      order: 2,
    };
    const result = await addPhoto(input);
    expect(result.caption).toBeNull();
  });
});
