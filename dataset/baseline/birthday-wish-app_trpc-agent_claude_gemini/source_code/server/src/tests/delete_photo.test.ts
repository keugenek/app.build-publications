import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { type CreateBirthdayCardInput, type CreatePhotoInput } from '../schema';
import { deletePhoto } from '../handlers/delete_photo';
import { eq } from 'drizzle-orm';

// Test data
const testCardInput: CreateBirthdayCardInput = {
  recipient_name: 'Test Person',
  message: 'Happy Birthday!'
};

const testPhotoInput: CreatePhotoInput = {
  card_id: 1, // Will be updated with actual card ID
  filename: 'test-photo.jpg',
  original_name: 'birthday-photo.jpg',
  file_size: 1024,
  mime_type: 'image/jpeg',
  caption: 'A wonderful birthday moment',
  display_order: 1
};

describe('deletePhoto', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing photo', async () => {
    // Create a birthday card first
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: testCardInput.recipient_name,
        message: testCardInput.message
      })
      .returning()
      .execute();

    const cardId = cardResult[0].id;

    // Create a photo
    const photoResult = await db.insert(photosTable)
      .values({
        ...testPhotoInput,
        card_id: cardId
      })
      .returning()
      .execute();

    const photoId = photoResult[0].id;

    // Delete the photo
    const deleteResult = await deletePhoto(photoId);

    // Verify deletion was successful
    expect(deleteResult).toBe(true);

    // Verify photo no longer exists in database
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, photoId))
      .execute();

    expect(photos).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent photo', async () => {
    const nonExistentPhotoId = 999;

    // Attempt to delete non-existent photo
    const deleteResult = await deletePhoto(nonExistentPhotoId);

    // Should return false since no rows were affected
    expect(deleteResult).toBe(false);
  });

  it('should delete photo without affecting the birthday card', async () => {
    // Create a birthday card
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: testCardInput.recipient_name,
        message: testCardInput.message
      })
      .returning()
      .execute();

    const cardId = cardResult[0].id;

    // Create a photo
    const photoResult = await db.insert(photosTable)
      .values({
        ...testPhotoInput,
        card_id: cardId
      })
      .returning()
      .execute();

    const photoId = photoResult[0].id;

    // Delete the photo
    const deleteResult = await deletePhoto(photoId);
    expect(deleteResult).toBe(true);

    // Verify the birthday card still exists
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, cardId))
      .execute();

    expect(cards).toHaveLength(1);
    expect(cards[0].recipient_name).toEqual(testCardInput.recipient_name);
    expect(cards[0].message).toEqual(testCardInput.message);
  });

  it('should handle multiple photo deletions correctly', async () => {
    // Create a birthday card
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: testCardInput.recipient_name,
        message: testCardInput.message
      })
      .returning()
      .execute();

    const cardId = cardResult[0].id;

    // Create multiple photos
    const photo1Result = await db.insert(photosTable)
      .values({
        ...testPhotoInput,
        card_id: cardId,
        filename: 'photo1.jpg',
        display_order: 1
      })
      .returning()
      .execute();

    const photo2Result = await db.insert(photosTable)
      .values({
        ...testPhotoInput,
        card_id: cardId,
        filename: 'photo2.jpg',
        display_order: 2
      })
      .returning()
      .execute();

    const photo1Id = photo1Result[0].id;
    const photo2Id = photo2Result[0].id;

    // Delete first photo
    const delete1Result = await deletePhoto(photo1Id);
    expect(delete1Result).toBe(true);

    // Verify only first photo is deleted
    const remainingPhotos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, cardId))
      .execute();

    expect(remainingPhotos).toHaveLength(1);
    expect(remainingPhotos[0].id).toEqual(photo2Id);
    expect(remainingPhotos[0].filename).toEqual('photo2.jpg');

    // Delete second photo
    const delete2Result = await deletePhoto(photo2Id);
    expect(delete2Result).toBe(true);

    // Verify no photos remain
    const finalPhotos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, cardId))
      .execute();

    expect(finalPhotos).toHaveLength(0);
  });

  it('should delete photo with null caption correctly', async () => {
    // Create a birthday card
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: testCardInput.recipient_name,
        message: testCardInput.message
      })
      .returning()
      .execute();

    const cardId = cardResult[0].id;

    // Create a photo with null caption
    const photoResult = await db.insert(photosTable)
      .values({
        ...testPhotoInput,
        card_id: cardId,
        caption: null
      })
      .returning()
      .execute();

    const photoId = photoResult[0].id;

    // Delete the photo
    const deleteResult = await deletePhoto(photoId);

    // Verify deletion was successful
    expect(deleteResult).toBe(true);

    // Verify photo no longer exists
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, photoId))
      .execute();

    expect(photos).toHaveLength(0);
  });
});
