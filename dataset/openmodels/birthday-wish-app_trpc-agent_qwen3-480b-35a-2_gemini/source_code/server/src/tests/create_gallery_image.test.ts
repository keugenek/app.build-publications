import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { galleryImagesTable } from '../db/schema';
import { type CreateGalleryImageInput } from '../schema';
import { createGalleryImage } from '../handlers/create_gallery_image';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateGalleryImageInput = {
  title: 'Test Image',
  url: 'https://example.com/test.jpg',
  order_index: 1
};

describe('createGalleryImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a gallery image', async () => {
    const result = await createGalleryImage(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Image');
    expect(result.url).toEqual('https://example.com/test.jpg');
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save gallery image to database', async () => {
    const result = await createGalleryImage(testInput);

    // Query using proper drizzle syntax
    const images = await db.select()
      .from(galleryImagesTable)
      .where(eq(galleryImagesTable.id, result.id))
      .execute();

    expect(images).toHaveLength(1);
    expect(images[0].title).toEqual('Test Image');
    expect(images[0].url).toEqual('https://example.com/test.jpg');
    expect(images[0].order_index).toEqual(1);
    expect(images[0].created_at).toBeInstanceOf(Date);
  });
});
