import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { type CreatePhotoInput } from '../schema';
import { addPhoto } from '../handlers/add_photo';
import { eq } from 'drizzle-orm';

// Test birthday card data
const testCard = {
  title: 'Happy Birthday!',
  message: 'Wishing you all the best on your special day!',
  recipient_name: 'Alice',
  sender_name: 'Bob',
  theme_color: '#ff69b4',
  is_active: true
};

// Test photo input
const testPhotoInput: CreatePhotoInput = {
  card_id: 1, // Will be updated after creating the card
  image_url: 'https://example.com/photo1.jpg',
  caption: 'Beautiful birthday moment',
  display_order: 1
};

describe('addPhoto', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add a photo to an active birthday card', async () => {
    // Create a birthday card first
    const cardResult = await db.insert(birthdayCardsTable)
      .values(testCard)
      .returning()
      .execute();

    const createdCard = cardResult[0];
    const photoInput = { ...testPhotoInput, card_id: createdCard.id };

    // Add photo to the card
    const result = await addPhoto(photoInput);

    // Verify photo was created with correct fields
    expect(result.card_id).toEqual(createdCard.id);
    expect(result.image_url).toEqual('https://example.com/photo1.jpg');
    expect(result.caption).toEqual('Beautiful birthday moment');
    expect(result.display_order).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save photo to database correctly', async () => {
    // Create a birthday card first
    const cardResult = await db.insert(birthdayCardsTable)
      .values(testCard)
      .returning()
      .execute();

    const createdCard = cardResult[0];
    const photoInput = { ...testPhotoInput, card_id: createdCard.id };

    // Add photo
    const result = await addPhoto(photoInput);

    // Query database to verify photo was saved
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, result.id))
      .execute();

    expect(photos).toHaveLength(1);
    expect(photos[0].card_id).toEqual(createdCard.id);
    expect(photos[0].image_url).toEqual('https://example.com/photo1.jpg');
    expect(photos[0].caption).toEqual('Beautiful birthday moment');
    expect(photos[0].display_order).toEqual(1);
    expect(photos[0].created_at).toBeInstanceOf(Date);
  });

  it('should add photo with null caption', async () => {
    // Create a birthday card first
    const cardResult = await db.insert(birthdayCardsTable)
      .values(testCard)
      .returning()
      .execute();

    const createdCard = cardResult[0];
    const photoInput: CreatePhotoInput = {
      ...testPhotoInput,
      card_id: createdCard.id,
      caption: null
    };

    // Add photo with null caption
    const result = await addPhoto(photoInput);

    // Verify photo was created with null caption
    expect(result.card_id).toEqual(createdCard.id);
    expect(result.image_url).toEqual('https://example.com/photo1.jpg');
    expect(result.caption).toBeNull();
    expect(result.display_order).toEqual(1);
  });

  it('should handle multiple photos with different display orders', async () => {
    // Create a birthday card first
    const cardResult = await db.insert(birthdayCardsTable)
      .values(testCard)
      .returning()
      .execute();

    const createdCard = cardResult[0];

    // Add first photo
    const photo1Input: CreatePhotoInput = {
      card_id: createdCard.id,
      image_url: 'https://example.com/photo1.jpg',
      caption: 'First photo',
      display_order: 1
    };

    // Add second photo
    const photo2Input: CreatePhotoInput = {
      card_id: createdCard.id,
      image_url: 'https://example.com/photo2.jpg',
      caption: 'Second photo',
      display_order: 2
    };

    const result1 = await addPhoto(photo1Input);
    const result2 = await addPhoto(photo2Input);

    // Verify both photos were created correctly
    expect(result1.display_order).toEqual(1);
    expect(result1.caption).toEqual('First photo');
    expect(result2.display_order).toEqual(2);
    expect(result2.caption).toEqual('Second photo');

    // Verify both photos are in database
    const allPhotos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, createdCard.id))
      .execute();

    expect(allPhotos).toHaveLength(2);
  });

  it('should throw error when birthday card does not exist', async () => {
    const photoInput: CreatePhotoInput = {
      card_id: 999, // Non-existent card ID
      image_url: 'https://example.com/photo1.jpg',
      caption: 'Test photo',
      display_order: 1
    };

    await expect(addPhoto(photoInput)).rejects.toThrow(/Birthday card with id 999 not found or is inactive/i);
  });

  it('should throw error when birthday card is inactive', async () => {
    // Create an inactive birthday card
    const inactiveCard = {
      ...testCard,
      is_active: false
    };

    const cardResult = await db.insert(birthdayCardsTable)
      .values(inactiveCard)
      .returning()
      .execute();

    const createdCard = cardResult[0];
    const photoInput: CreatePhotoInput = {
      card_id: createdCard.id,
      image_url: 'https://example.com/photo1.jpg',
      caption: 'Test photo',
      display_order: 1
    };

    await expect(addPhoto(photoInput)).rejects.toThrow(/Birthday card with id \d+ not found or is inactive/i);
  });

  it('should handle large display order values', async () => {
    // Create a birthday card first
    const cardResult = await db.insert(birthdayCardsTable)
      .values(testCard)
      .returning()
      .execute();

    const createdCard = cardResult[0];
    const photoInput: CreatePhotoInput = {
      card_id: createdCard.id,
      image_url: 'https://example.com/photo1.jpg',
      caption: 'High order photo',
      display_order: 100
    };

    const result = await addPhoto(photoInput);

    expect(result.display_order).toEqual(100);
    expect(result.card_id).toEqual(createdCard.id);
  });
});
