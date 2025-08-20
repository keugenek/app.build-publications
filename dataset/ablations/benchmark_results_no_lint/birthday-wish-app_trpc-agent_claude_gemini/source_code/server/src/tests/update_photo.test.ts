import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { type UpdatePhotoInput } from '../schema';
import { updatePhoto } from '../handlers/update_photo';
import { eq } from 'drizzle-orm';

// Test data
const testCard = {
  recipient_name: 'John Doe',
  message: 'Happy Birthday!',
  sender_name: 'Jane Smith',
  theme: 'confetti' as const
};

const testPhoto = {
  image_url: 'https://example.com/photo1.jpg',
  caption: 'Original caption',
  display_order: 1
};

describe('updatePhoto', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let cardId: number;
  let photoId: number;

  beforeEach(async () => {
    // Create a birthday card first (required for foreign key)
    const cardResult = await db.insert(birthdayCardsTable)
      .values(testCard)
      .returning()
      .execute();
    cardId = cardResult[0].id;

    // Create a photo
    const photoResult = await db.insert(photosTable)
      .values({
        card_id: cardId,
        ...testPhoto
      })
      .returning()
      .execute();
    photoId = photoResult[0].id;
  });

  it('should update photo with all fields', async () => {
    const updateInput: UpdatePhotoInput = {
      id: photoId,
      image_url: 'https://example.com/updated-photo.jpg',
      caption: 'Updated caption',
      display_order: 5
    };

    const result = await updatePhoto(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(photoId);
    expect(result!.image_url).toEqual('https://example.com/updated-photo.jpg');
    expect(result!.caption).toEqual('Updated caption');
    expect(result!.display_order).toEqual(5);
    expect(result!.card_id).toEqual(cardId);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update photo with partial fields', async () => {
    const updateInput: UpdatePhotoInput = {
      id: photoId,
      image_url: 'https://example.com/new-image.jpg'
    };

    const result = await updatePhoto(updateInput);

    expect(result).toBeDefined();
    expect(result!.image_url).toEqual('https://example.com/new-image.jpg');
    expect(result!.caption).toEqual('Original caption'); // Unchanged
    expect(result!.display_order).toEqual(1); // Unchanged
  });

  it('should update caption only', async () => {
    const updateInput: UpdatePhotoInput = {
      id: photoId,
      caption: 'Only caption changed'
    };

    const result = await updatePhoto(updateInput);

    expect(result).toBeDefined();
    expect(result!.caption).toEqual('Only caption changed');
    expect(result!.image_url).toEqual('https://example.com/photo1.jpg'); // Unchanged
    expect(result!.display_order).toEqual(1); // Unchanged
  });

  it('should update display_order only', async () => {
    const updateInput: UpdatePhotoInput = {
      id: photoId,
      display_order: 10
    };

    const result = await updatePhoto(updateInput);

    expect(result).toBeDefined();
    expect(result!.display_order).toEqual(10);
    expect(result!.image_url).toEqual('https://example.com/photo1.jpg'); // Unchanged
    expect(result!.caption).toEqual('Original caption'); // Unchanged
  });

  it('should set caption to null', async () => {
    const updateInput: UpdatePhotoInput = {
      id: photoId,
      caption: null
    };

    const result = await updatePhoto(updateInput);

    expect(result).toBeDefined();
    expect(result!.caption).toBeNull();
    expect(result!.image_url).toEqual('https://example.com/photo1.jpg'); // Unchanged
    expect(result!.display_order).toEqual(1); // Unchanged
  });

  it('should return existing photo when no fields to update', async () => {
    const updateInput: UpdatePhotoInput = {
      id: photoId
    };

    const result = await updatePhoto(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(photoId);
    expect(result!.image_url).toEqual('https://example.com/photo1.jpg');
    expect(result!.caption).toEqual('Original caption');
    expect(result!.display_order).toEqual(1);
  });

  it('should return null for non-existent photo', async () => {
    const updateInput: UpdatePhotoInput = {
      id: 99999,
      caption: 'This should not work'
    };

    const result = await updatePhoto(updateInput);

    expect(result).toBeNull();
  });

  it('should persist changes to database', async () => {
    const updateInput: UpdatePhotoInput = {
      id: photoId,
      image_url: 'https://example.com/persisted-photo.jpg',
      caption: 'Persisted caption',
      display_order: 3
    };

    await updatePhoto(updateInput);

    // Query database directly to verify changes were persisted
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, photoId))
      .execute();

    expect(photos).toHaveLength(1);
    expect(photos[0].image_url).toEqual('https://example.com/persisted-photo.jpg');
    expect(photos[0].caption).toEqual('Persisted caption');
    expect(photos[0].display_order).toEqual(3);
  });

  it('should handle zero display_order correctly', async () => {
    const updateInput: UpdatePhotoInput = {
      id: photoId,
      display_order: 0
    };

    const result = await updatePhoto(updateInput);

    expect(result).toBeDefined();
    expect(result!.display_order).toEqual(0);
  });

  it('should update with empty string caption', async () => {
    const updateInput: UpdatePhotoInput = {
      id: photoId,
      caption: ''
    };

    const result = await updatePhoto(updateInput);

    expect(result).toBeDefined();
    expect(result!.caption).toEqual('');
  });
});
