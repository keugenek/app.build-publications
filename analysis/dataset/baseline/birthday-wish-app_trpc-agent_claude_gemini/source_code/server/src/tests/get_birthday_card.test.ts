import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { getBirthdayCard } from '../handlers/get_birthday_card';
import { eq } from 'drizzle-orm';

describe('getBirthdayCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent card', async () => {
    const result = await getBirthdayCard(999);
    expect(result).toBeNull();
  });

  it('should return birthday card without photos', async () => {
    // Create a birthday card
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'John Doe',
        message: 'Happy Birthday!'
      })
      .returning()
      .execute();

    const cardId = cardResult[0].id;

    const result = await getBirthdayCard(cardId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(cardId);
    expect(result!.recipient_name).toBe('John Doe');
    expect(result!.message).toBe('Happy Birthday!');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.photos).toEqual([]);
  });

  it('should return birthday card with multiple photos ordered by display_order', async () => {
    // Create a birthday card
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Jane Smith',
        message: 'Wishing you a wonderful birthday!'
      })
      .returning()
      .execute();

    const cardId = cardResult[0].id;

    // Create photos in non-sequential display order to test ordering
    await db.insert(photosTable)
      .values([
        {
          card_id: cardId,
          filename: 'photo3.jpg',
          original_name: 'Third Photo.jpg',
          file_size: 300000,
          mime_type: 'image/jpeg',
          caption: 'Third photo',
          display_order: 3
        },
        {
          card_id: cardId,
          filename: 'photo1.jpg',
          original_name: 'First Photo.jpg',
          file_size: 100000,
          mime_type: 'image/jpeg',
          caption: 'First photo',
          display_order: 1
        },
        {
          card_id: cardId,
          filename: 'photo2.jpg',
          original_name: 'Second Photo.jpg',
          file_size: 200000,
          mime_type: 'image/jpeg',
          caption: null, // Test null caption
          display_order: 2
        }
      ])
      .execute();

    const result = await getBirthdayCard(cardId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(cardId);
    expect(result!.recipient_name).toBe('Jane Smith');
    expect(result!.message).toBe('Wishing you a wonderful birthday!');
    expect(result!.photos).toHaveLength(3);

    // Verify photos are ordered by display_order
    expect(result!.photos[0].filename).toBe('photo1.jpg');
    expect(result!.photos[0].caption).toBe('First photo');
    expect(result!.photos[0].display_order).toBe(1);

    expect(result!.photos[1].filename).toBe('photo2.jpg');
    expect(result!.photos[1].caption).toBeNull();
    expect(result!.photos[1].display_order).toBe(2);

    expect(result!.photos[2].filename).toBe('photo3.jpg');
    expect(result!.photos[2].caption).toBe('Third photo');
    expect(result!.photos[2].display_order).toBe(3);

    // Verify all photo fields are present
    result!.photos.forEach(photo => {
      expect(photo.id).toBeDefined();
      expect(photo.card_id).toBe(cardId);
      expect(photo.filename).toBeDefined();
      expect(photo.original_name).toBeDefined();
      expect(photo.file_size).toBeGreaterThan(0);
      expect(photo.mime_type).toBeDefined();
      expect(photo.display_order).toBeGreaterThanOrEqual(0);
      expect(photo.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return correct card when multiple cards exist', async () => {
    // Create multiple birthday cards
    const card1Result = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Alice',
        message: 'Happy Birthday Alice!'
      })
      .returning()
      .execute();

    const card2Result = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Bob',
        message: 'Happy Birthday Bob!'
      })
      .returning()
      .execute();

    const card1Id = card1Result[0].id;
    const card2Id = card2Result[0].id;

    // Add photos to both cards
    await db.insert(photosTable)
      .values([
        {
          card_id: card1Id,
          filename: 'alice_photo.jpg',
          original_name: 'Alice Photo.jpg',
          file_size: 100000,
          mime_type: 'image/jpeg',
          caption: 'Alice photo',
          display_order: 1
        },
        {
          card_id: card2Id,
          filename: 'bob_photo.jpg',
          original_name: 'Bob Photo.jpg',
          file_size: 200000,
          mime_type: 'image/jpeg',
          caption: 'Bob photo',
          display_order: 1
        }
      ])
      .execute();

    // Fetch card 1 and verify it only returns its own data
    const result1 = await getBirthdayCard(card1Id);
    expect(result1).not.toBeNull();
    expect(result1!.recipient_name).toBe('Alice');
    expect(result1!.message).toBe('Happy Birthday Alice!');
    expect(result1!.photos).toHaveLength(1);
    expect(result1!.photos[0].filename).toBe('alice_photo.jpg');

    // Fetch card 2 and verify it only returns its own data
    const result2 = await getBirthdayCard(card2Id);
    expect(result2).not.toBeNull();
    expect(result2!.recipient_name).toBe('Bob');
    expect(result2!.message).toBe('Happy Birthday Bob!');
    expect(result2!.photos).toHaveLength(1);
    expect(result2!.photos[0].filename).toBe('bob_photo.jpg');
  });

  it('should handle cards with zero display_order photos', async () => {
    // Create a birthday card
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Test User',
        message: 'Test message'
      })
      .returning()
      .execute();

    const cardId = cardResult[0].id;

    // Create photos with display_order starting from 0
    await db.insert(photosTable)
      .values([
        {
          card_id: cardId,
          filename: 'photo0.jpg',
          original_name: 'Zero Photo.jpg',
          file_size: 100000,
          mime_type: 'image/jpeg',
          caption: 'Zero order photo',
          display_order: 0
        },
        {
          card_id: cardId,
          filename: 'photo5.jpg',
          original_name: 'Fifth Photo.jpg',
          file_size: 200000,
          mime_type: 'image/jpeg',
          caption: 'Fifth order photo',
          display_order: 5
        }
      ])
      .execute();

    const result = await getBirthdayCard(cardId);

    expect(result).not.toBeNull();
    expect(result!.photos).toHaveLength(2);
    // Should be ordered: 0, then 5
    expect(result!.photos[0].display_order).toBe(0);
    expect(result!.photos[1].display_order).toBe(5);
  });

  it('should verify database persistence', async () => {
    // Create and fetch a card
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Persistent User',
        message: 'Persistence test message'
      })
      .returning()
      .execute();

    const cardId = cardResult[0].id;

    // Verify the card exists in database
    const dbCards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, cardId))
      .execute();

    expect(dbCards).toHaveLength(1);
    expect(dbCards[0].recipient_name).toBe('Persistent User');

    // Fetch via handler
    const result = await getBirthdayCard(cardId);
    expect(result).not.toBeNull();
    expect(result!.recipient_name).toBe('Persistent User');
    expect(result!.message).toBe('Persistence test message');
  });
});
