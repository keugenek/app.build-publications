import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { type UpdatePhotoInput } from '../schema';
import { updatePhoto } from '../handlers/update_photo';
import { eq } from 'drizzle-orm';

describe('updatePhoto', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let cardId: number;
  let photoId: number;

  beforeEach(async () => {
    // Create prerequisite birthday card
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Test Recipient',
        message: 'Happy Birthday!'
      })
      .returning()
      .execute();
    
    cardId = cardResult[0].id;

    // Create test photo
    const photoResult = await db.insert(photosTable)
      .values({
        card_id: cardId,
        filename: 'test-photo.jpg',
        original_name: 'original-photo.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        caption: 'Original caption',
        display_order: 1
      })
      .returning()
      .execute();
    
    photoId = photoResult[0].id;
  });

  it('should update photo caption only', async () => {
    const input: UpdatePhotoInput = {
      id: photoId,
      caption: 'Updated caption'
    };

    const result = await updatePhoto(input);

    expect(result).toBeDefined();
    expect(result!.id).toBe(photoId);
    expect(result!.caption).toBe('Updated caption');
    expect(result!.display_order).toBe(1); // Should remain unchanged
    expect(result!.filename).toBe('test-photo.jpg'); // Should remain unchanged
  });

  it('should update display order only', async () => {
    const input: UpdatePhotoInput = {
      id: photoId,
      display_order: 5
    };

    const result = await updatePhoto(input);

    expect(result).toBeDefined();
    expect(result!.id).toBe(photoId);
    expect(result!.display_order).toBe(5);
    expect(result!.caption).toBe('Original caption'); // Should remain unchanged
    expect(result!.filename).toBe('test-photo.jpg'); // Should remain unchanged
  });

  it('should update both caption and display order', async () => {
    const input: UpdatePhotoInput = {
      id: photoId,
      caption: 'New caption',
      display_order: 3
    };

    const result = await updatePhoto(input);

    expect(result).toBeDefined();
    expect(result!.id).toBe(photoId);
    expect(result!.caption).toBe('New caption');
    expect(result!.display_order).toBe(3);
    expect(result!.filename).toBe('test-photo.jpg'); // Should remain unchanged
  });

  it('should set caption to null', async () => {
    const input: UpdatePhotoInput = {
      id: photoId,
      caption: null
    };

    const result = await updatePhoto(input);

    expect(result).toBeDefined();
    expect(result!.id).toBe(photoId);
    expect(result!.caption).toBeNull();
    expect(result!.display_order).toBe(1); // Should remain unchanged
  });

  it('should update display order to zero', async () => {
    const input: UpdatePhotoInput = {
      id: photoId,
      display_order: 0
    };

    const result = await updatePhoto(input);

    expect(result).toBeDefined();
    expect(result!.id).toBe(photoId);
    expect(result!.display_order).toBe(0);
    expect(result!.caption).toBe('Original caption'); // Should remain unchanged
  });

  it('should return existing photo when no fields are provided for update', async () => {
    const input: UpdatePhotoInput = {
      id: photoId
    };

    const result = await updatePhoto(input);

    expect(result).toBeDefined();
    expect(result!.id).toBe(photoId);
    expect(result!.caption).toBe('Original caption'); // Unchanged
    expect(result!.display_order).toBe(1); // Unchanged
    expect(result!.filename).toBe('test-photo.jpg'); // Unchanged
  });

  it('should return null for non-existent photo', async () => {
    const input: UpdatePhotoInput = {
      id: 99999, // Non-existent ID
      caption: 'Updated caption'
    };

    const result = await updatePhoto(input);

    expect(result).toBeNull();
  });

  it('should persist changes to database', async () => {
    const input: UpdatePhotoInput = {
      id: photoId,
      caption: 'Persisted caption',
      display_order: 10
    };

    await updatePhoto(input);

    // Verify changes are persisted in database
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, photoId))
      .execute();

    expect(photos).toHaveLength(1);
    expect(photos[0].caption).toBe('Persisted caption');
    expect(photos[0].display_order).toBe(10);
    expect(photos[0].filename).toBe('test-photo.jpg'); // Unchanged
  });

  it('should handle updating multiple photos independently', async () => {
    // Create second photo
    const secondPhotoResult = await db.insert(photosTable)
      .values({
        card_id: cardId,
        filename: 'second-photo.jpg',
        original_name: 'second-original.jpg',
        file_size: 2048,
        mime_type: 'image/jpeg',
        caption: 'Second caption',
        display_order: 2
      })
      .returning()
      .execute();
    
    const secondPhotoId = secondPhotoResult[0].id;

    // Update first photo
    const firstUpdate: UpdatePhotoInput = {
      id: photoId,
      caption: 'First updated'
    };

    const firstResult = await updatePhoto(firstUpdate);

    // Update second photo
    const secondUpdate: UpdatePhotoInput = {
      id: secondPhotoId,
      display_order: 5
    };

    const secondResult = await updatePhoto(secondUpdate);

    // Verify both photos updated independently
    expect(firstResult!.caption).toBe('First updated');
    expect(firstResult!.display_order).toBe(1); // Unchanged

    expect(secondResult!.caption).toBe('Second caption'); // Unchanged
    expect(secondResult!.display_order).toBe(5);
  });
});
