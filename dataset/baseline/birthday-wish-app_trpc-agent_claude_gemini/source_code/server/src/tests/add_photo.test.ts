import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { type CreatePhotoInput } from '../schema';
import { addPhoto } from '../handlers/add_photo';
import { eq } from 'drizzle-orm';

describe('addPhoto', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let cardId: number;

  beforeEach(async () => {
    // Create a birthday card for testing
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Test Recipient',
        message: 'Happy Birthday!'
      })
      .returning()
      .execute();
    
    cardId = cardResult[0].id;
  });

  const testInput: CreatePhotoInput = {
    card_id: 0, // Will be set in each test
    filename: 'birthday-photo-123.jpg',
    original_name: 'birthday_celebration.jpg',
    file_size: 2048000,
    mime_type: 'image/jpeg',
    caption: 'Amazing birthday celebration!',
    display_order: 1
  };

  it('should add a photo to an existing birthday card', async () => {
    const input = { ...testInput, card_id: cardId };
    
    const result = await addPhoto(input);

    // Verify all fields are returned correctly
    expect(result.card_id).toEqual(cardId);
    expect(result.filename).toEqual('birthday-photo-123.jpg');
    expect(result.original_name).toEqual('birthday_celebration.jpg');
    expect(result.file_size).toEqual(2048000);
    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.caption).toEqual('Amazing birthday celebration!');
    expect(result.display_order).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save photo to database', async () => {
    const input = { ...testInput, card_id: cardId };
    
    const result = await addPhoto(input);

    // Verify photo was saved to database
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, result.id))
      .execute();

    expect(photos).toHaveLength(1);
    const savedPhoto = photos[0];
    expect(savedPhoto.card_id).toEqual(cardId);
    expect(savedPhoto.filename).toEqual('birthday-photo-123.jpg');
    expect(savedPhoto.original_name).toEqual('birthday_celebration.jpg');
    expect(savedPhoto.file_size).toEqual(2048000);
    expect(savedPhoto.mime_type).toEqual('image/jpeg');
    expect(savedPhoto.caption).toEqual('Amazing birthday celebration!');
    expect(savedPhoto.display_order).toEqual(1);
    expect(savedPhoto.created_at).toBeInstanceOf(Date);
  });

  it('should handle photo with null caption', async () => {
    const input = { 
      ...testInput, 
      card_id: cardId,
      caption: null 
    };
    
    const result = await addPhoto(input);

    expect(result.caption).toBeNull();
    
    // Verify in database
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, result.id))
      .execute();

    expect(photos[0].caption).toBeNull();
  });

  it('should handle multiple photos with different display orders', async () => {
    const input1 = { ...testInput, card_id: cardId, display_order: 1, filename: 'photo1.jpg' };
    const input2 = { ...testInput, card_id: cardId, display_order: 2, filename: 'photo2.jpg' };
    const input3 = { ...testInput, card_id: cardId, display_order: 0, filename: 'photo3.jpg' };

    const result1 = await addPhoto(input1);
    const result2 = await addPhoto(input2);
    const result3 = await addPhoto(input3);

    expect(result1.display_order).toEqual(1);
    expect(result2.display_order).toEqual(2);
    expect(result3.display_order).toEqual(0);

    // Verify all photos were saved for the same card
    const allPhotos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, cardId))
      .execute();

    expect(allPhotos).toHaveLength(3);
    expect(allPhotos.map(p => p.filename).sort()).toEqual(['photo1.jpg', 'photo2.jpg', 'photo3.jpg']);
  });

  it('should throw error when birthday card does not exist', async () => {
    const nonExistentCardId = 99999;
    const input = { ...testInput, card_id: nonExistentCardId };

    await expect(addPhoto(input)).rejects.toThrow(/Birthday card with ID 99999 not found/i);
  });

  it('should handle various file types and sizes', async () => {
    const pngInput = {
      ...testInput,
      card_id: cardId,
      filename: 'birthday-image.png',
      original_name: 'celebration.png',
      file_size: 512000,
      mime_type: 'image/png'
    };

    const result = await addPhoto(pngInput);

    expect(result.filename).toEqual('birthday-image.png');
    expect(result.mime_type).toEqual('image/png');
    expect(result.file_size).toEqual(512000);

    // Verify different file type was saved correctly
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, result.id))
      .execute();

    expect(photos[0].mime_type).toEqual('image/png');
    expect(photos[0].file_size).toEqual(512000);
  });

  it('should validate foreign key constraint by checking card exists first', async () => {
    // Create another card and then delete it to test the validation
    const tempCardResult = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Temp Card',
        message: 'Will be deleted'
      })
      .returning()
      .execute();

    const tempCardId = tempCardResult[0].id;

    // Delete the card
    await db.delete(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, tempCardId))
      .execute();

    // Try to add photo to deleted card
    const input = { ...testInput, card_id: tempCardId };

    await expect(addPhoto(input)).rejects.toThrow(/Birthday card with ID .* not found/i);
  });
});
