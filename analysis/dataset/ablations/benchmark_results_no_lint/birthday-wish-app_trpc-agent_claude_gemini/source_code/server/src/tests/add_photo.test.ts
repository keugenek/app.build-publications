import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { type AddPhotoInput } from '../schema';
import { addPhoto } from '../handlers/add_photo';
import { eq } from 'drizzle-orm';

// Test input for adding photos
const testPhotoInput: AddPhotoInput = {
  card_id: 1,
  image_url: 'https://example.com/photo.jpg',
  caption: 'Happy Birthday!',
  display_order: 0
};

const testPhotoInputWithoutCaption: AddPhotoInput = {
  card_id: 1,
  image_url: 'https://example.com/photo2.jpg',
  caption: null,
  display_order: 1
};

describe('addPhoto', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test birthday card
  const createTestCard = async () => {
    const result = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Alice Johnson',
        message: 'Wishing you a wonderful birthday!',
        sender_name: 'Bob Smith',
        theme: 'confetti'
      })
      .returning()
      .execute();

    return result[0];
  };

  it('should add a photo to an existing birthday card', async () => {
    // Create prerequisite birthday card
    await createTestCard();

    const result = await addPhoto(testPhotoInput);

    // Verify photo properties
    expect(result.id).toBeDefined();
    expect(result.card_id).toEqual(1);
    expect(result.image_url).toEqual('https://example.com/photo.jpg');
    expect(result.caption).toEqual('Happy Birthday!');
    expect(result.display_order).toEqual(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save photo to database', async () => {
    // Create prerequisite birthday card
    await createTestCard();

    const result = await addPhoto(testPhotoInput);

    // Query database to verify photo was saved
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.id, result.id))
      .execute();

    expect(photos).toHaveLength(1);
    expect(photos[0].card_id).toEqual(1);
    expect(photos[0].image_url).toEqual('https://example.com/photo.jpg');
    expect(photos[0].caption).toEqual('Happy Birthday!');
    expect(photos[0].display_order).toEqual(0);
    expect(photos[0].created_at).toBeInstanceOf(Date);
  });

  it('should add photo with null caption', async () => {
    // Create prerequisite birthday card
    await createTestCard();

    const result = await addPhoto(testPhotoInputWithoutCaption);

    expect(result.caption).toBeNull();
    expect(result.image_url).toEqual('https://example.com/photo2.jpg');
    expect(result.display_order).toEqual(1);
  });

  it('should throw error when birthday card does not exist', async () => {
    const invalidInput: AddPhotoInput = {
      card_id: 999,
      image_url: 'https://example.com/photo.jpg',
      caption: 'Test',
      display_order: 0
    };

    await expect(addPhoto(invalidInput)).rejects.toThrow(/Birthday card with id 999 not found/i);
  });

  it('should shift existing photos when adding photo with same display_order', async () => {
    // Create prerequisite birthday card
    await createTestCard();

    // Add first photo with display_order 0
    await addPhoto({
      card_id: 1,
      image_url: 'https://example.com/first.jpg',
      caption: 'First photo',
      display_order: 0
    });

    // Add second photo with display_order 1
    await addPhoto({
      card_id: 1,
      image_url: 'https://example.com/second.jpg',
      caption: 'Second photo',
      display_order: 1
    });

    // Add third photo with display_order 0 (should shift others)
    const newPhoto = await addPhoto({
      card_id: 1,
      image_url: 'https://example.com/new.jpg',
      caption: 'New first photo',
      display_order: 0
    });

    // Verify new photo was inserted at position 0
    expect(newPhoto.display_order).toEqual(0);
    expect(newPhoto.image_url).toEqual('https://example.com/new.jpg');

    // Check that existing photos were shifted
    const allPhotos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, 1))
      .execute();

    expect(allPhotos).toHaveLength(3);

    // Sort by display_order to check positions
    const sortedPhotos = allPhotos.sort((a, b) => a.display_order - b.display_order);

    expect(sortedPhotos[0].image_url).toEqual('https://example.com/new.jpg');
    expect(sortedPhotos[0].display_order).toEqual(0);

    expect(sortedPhotos[1].image_url).toEqual('https://example.com/first.jpg');
    expect(sortedPhotos[1].display_order).toEqual(1);

    expect(sortedPhotos[2].image_url).toEqual('https://example.com/second.jpg');
    expect(sortedPhotos[2].display_order).toEqual(2);
  });

  it('should shift multiple photos when inserting in middle', async () => {
    // Create prerequisite birthday card
    await createTestCard();

    // Add photos with display_order 0, 1, 2
    await addPhoto({
      card_id: 1,
      image_url: 'https://example.com/photo0.jpg',
      caption: 'Photo 0',
      display_order: 0
    });

    await addPhoto({
      card_id: 1,
      image_url: 'https://example.com/photo2.jpg',
      caption: 'Photo 2',
      display_order: 2
    });

    await addPhoto({
      card_id: 1,
      image_url: 'https://example.com/photo4.jpg',
      caption: 'Photo 4',
      display_order: 4
    });

    // Insert photo at position 1 (should shift photos at positions 2 and 4)
    await addPhoto({
      card_id: 1,
      image_url: 'https://example.com/photo1.jpg',
      caption: 'Photo 1',
      display_order: 1
    });

    // Check final ordering
    const allPhotos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, 1))
      .execute();

    expect(allPhotos).toHaveLength(4);

    const sortedPhotos = allPhotos.sort((a, b) => a.display_order - b.display_order);

    expect(sortedPhotos[0].image_url).toEqual('https://example.com/photo0.jpg');
    expect(sortedPhotos[0].display_order).toEqual(0);

    expect(sortedPhotos[1].image_url).toEqual('https://example.com/photo1.jpg');
    expect(sortedPhotos[1].display_order).toEqual(1);

    expect(sortedPhotos[2].image_url).toEqual('https://example.com/photo2.jpg');
    expect(sortedPhotos[2].display_order).toEqual(3); // Shifted from 2 to 3

    expect(sortedPhotos[3].image_url).toEqual('https://example.com/photo4.jpg');
    expect(sortedPhotos[3].display_order).toEqual(5); // Shifted from 4 to 5
  });

  it('should not shift photos with lower display_order', async () => {
    // Create prerequisite birthday card
    await createTestCard();

    // Add photos with display_order 0, 2, 4
    await addPhoto({
      card_id: 1,
      image_url: 'https://example.com/photo0.jpg',
      caption: 'Photo 0',
      display_order: 0
    });

    await addPhoto({
      card_id: 1,
      image_url: 'https://example.com/photo2.jpg',
      caption: 'Photo 2',
      display_order: 2
    });

    await addPhoto({
      card_id: 1,
      image_url: 'https://example.com/photo4.jpg',
      caption: 'Photo 4',
      display_order: 4
    });

    // Insert photo at position 3 (should only shift photo at position 4)
    await addPhoto({
      card_id: 1,
      image_url: 'https://example.com/photo3.jpg',
      caption: 'Photo 3',
      display_order: 3
    });

    // Check final ordering
    const allPhotos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, 1))
      .execute();

    expect(allPhotos).toHaveLength(4);

    const sortedPhotos = allPhotos.sort((a, b) => a.display_order - b.display_order);

    // Photos with lower display_order should remain unchanged
    expect(sortedPhotos[0].image_url).toEqual('https://example.com/photo0.jpg');
    expect(sortedPhotos[0].display_order).toEqual(0);

    expect(sortedPhotos[1].image_url).toEqual('https://example.com/photo2.jpg');
    expect(sortedPhotos[1].display_order).toEqual(2);

    // New photo should be at position 3
    expect(sortedPhotos[2].image_url).toEqual('https://example.com/photo3.jpg');
    expect(sortedPhotos[2].display_order).toEqual(3);

    // Photo at position 4 should be shifted to 5
    expect(sortedPhotos[3].image_url).toEqual('https://example.com/photo4.jpg');
    expect(sortedPhotos[3].display_order).toEqual(5);
  });

  it('should handle photos for different cards independently', async () => {
    // Create two test birthday cards
    const card1 = await createTestCard();
    const card2 = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Charlie Brown',
        message: 'Another birthday message!',
        sender_name: 'Diana Prince',
        theme: 'balloons'
      })
      .returning()
      .execute();

    // Add photos to card 1
    await addPhoto({
      card_id: card1.id,
      image_url: 'https://example.com/card1-photo0.jpg',
      caption: 'Card 1 Photo 0',
      display_order: 0
    });

    await addPhoto({
      card_id: card1.id,
      image_url: 'https://example.com/card1-photo1.jpg',
      caption: 'Card 1 Photo 1',
      display_order: 1
    });

    // Add photos to card 2
    await addPhoto({
      card_id: card2[0].id,
      image_url: 'https://example.com/card2-photo0.jpg',
      caption: 'Card 2 Photo 0',
      display_order: 0
    });

    // Add photo to card 2 with same display_order as existing photo
    // Should only shift photos in card 2, not card 1
    await addPhoto({
      card_id: card2[0].id,
      image_url: 'https://example.com/card2-new.jpg',
      caption: 'Card 2 New Photo',
      display_order: 0
    });

    // Verify card 1 photos remain unchanged
    const card1Photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, card1.id))
      .execute();

    expect(card1Photos).toHaveLength(2);
    const sortedCard1Photos = card1Photos.sort((a, b) => a.display_order - b.display_order);
    expect(sortedCard1Photos[0].display_order).toEqual(0);
    expect(sortedCard1Photos[1].display_order).toEqual(1);

    // Verify card 2 photos were shifted correctly
    const card2Photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, card2[0].id))
      .execute();

    expect(card2Photos).toHaveLength(2);
    const sortedCard2Photos = card2Photos.sort((a, b) => a.display_order - b.display_order);
    expect(sortedCard2Photos[0].image_url).toEqual('https://example.com/card2-new.jpg');
    expect(sortedCard2Photos[0].display_order).toEqual(0);
    expect(sortedCard2Photos[1].image_url).toEqual('https://example.com/card2-photo0.jpg');
    expect(sortedCard2Photos[1].display_order).toEqual(1);
  });
});
