import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { deletePhoto } from '../handlers/delete_photo';
import { eq } from 'drizzle-orm';

describe('deletePhoto', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing photo and return true', async () => {
    // Create a birthday card first (required for foreign key)
    const card = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Test User',
        message: 'Happy Birthday!',
        sender_name: 'Test Sender',
        theme: 'confetti'
      })
      .returning()
      .execute();

    // Create a photo
    const photo = await db.insert(photosTable)
      .values({
        card_id: card[0].id,
        image_url: 'https://example.com/photo.jpg',
        caption: 'Test photo',
        display_order: 1
      })
      .returning()
      .execute();

    // Delete the photo
    const result = await deletePhoto(photo[0].id);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify photo was actually deleted from database
    const deletedPhotos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, photo[0].id))
      .execute();

    expect(deletedPhotos).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent photo', async () => {
    // Try to delete a photo that doesn't exist
    const result = await deletePhoto(99999);

    // Should return false for no records deleted
    expect(result).toBe(false);
  });

  it('should handle multiple photos and only delete the specified one', async () => {
    // Create a birthday card first
    const card = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Test User',
        message: 'Happy Birthday!',
        sender_name: 'Test Sender',
        theme: 'balloons'
      })
      .returning()
      .execute();

    // Create multiple photos
    const photo1 = await db.insert(photosTable)
      .values({
        card_id: card[0].id,
        image_url: 'https://example.com/photo1.jpg',
        caption: 'First photo',
        display_order: 1
      })
      .returning()
      .execute();

    const photo2 = await db.insert(photosTable)
      .values({
        card_id: card[0].id,
        image_url: 'https://example.com/photo2.jpg',
        caption: 'Second photo',
        display_order: 2
      })
      .returning()
      .execute();

    // Delete only the first photo
    const result = await deletePhoto(photo1[0].id);

    expect(result).toBe(true);

    // Verify only the first photo was deleted
    const remainingPhotos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, card[0].id))
      .execute();

    expect(remainingPhotos).toHaveLength(1);
    expect(remainingPhotos[0].id).toBe(photo2[0].id);
    expect(remainingPhotos[0].caption).toBe('Second photo');
  });

  it('should work correctly with cascade delete when card is deleted first', async () => {
    // Create a birthday card
    const card = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Test User',
        message: 'Happy Birthday!',
        sender_name: 'Test Sender',
        theme: 'sparkles'
      })
      .returning()
      .execute();

    // Create a photo
    const photo = await db.insert(photosTable)
      .values({
        card_id: card[0].id,
        image_url: 'https://example.com/photo.jpg',
        caption: 'Test photo',
        display_order: 1
      })
      .returning()
      .execute();

    // Delete the card (should cascade delete the photo)
    await db.delete(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, card[0].id))
      .execute();

    // Try to delete the photo (should return false since it's already deleted)
    const result = await deletePhoto(photo[0].id);

    expect(result).toBe(false);

    // Verify no photos exist for this card
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, card[0].id))
      .execute();

    expect(photos).toHaveLength(0);
  });
});
