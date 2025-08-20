import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, galleryImagesTable } from '../db/schema';
import { getBirthdayCards } from '../handlers/get_birthday_cards';

describe('getBirthdayCards', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no cards exist', async () => {
    const result = await getBirthdayCards();
    expect(result).toEqual([]);
  });

  it('should return active birthday cards only', async () => {
    // Create active card
    await db.insert(birthdayCardsTable).values({
      title: 'Happy Birthday!',
      message: 'Hope you have a wonderful day!',
      recipient_name: 'John',
      sender_name: 'Jane',
      is_active: true
    }).execute();

    // Create inactive card
    await db.insert(birthdayCardsTable).values({
      title: 'Old Card',
      message: 'This should not appear',
      recipient_name: 'Bob',
      sender_name: 'Alice',
      is_active: false
    }).execute();

    const result = await getBirthdayCards();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Happy Birthday!');
    expect(result[0].recipient_name).toBe('John');
    expect(result[0].sender_name).toBe('Jane');
    expect(result[0].is_active).toBe(true);
    expect(result[0].images).toEqual([]);
  });

  it('should return birthday card with gallery images', async () => {
    // Create birthday card
    const [card] = await db.insert(birthdayCardsTable).values({
      title: 'Birthday Celebration',
      message: 'Lets celebrate!',
      recipient_name: 'Sarah',
      sender_name: 'Mike',
      is_active: true
    }).returning().execute();

    // Add gallery images
    await db.insert(galleryImagesTable).values([
      {
        card_id: card.id,
        image_url: 'https://example.com/image1.jpg',
        alt_text: 'Birthday cake',
        display_order: 2
      },
      {
        card_id: card.id,
        image_url: 'https://example.com/image2.jpg',
        alt_text: 'Party balloons',
        display_order: 1
      }
    ]).execute();

    const result = await getBirthdayCards();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(card.id);
    expect(result[0].title).toBe('Birthday Celebration');
    expect(result[0].images).toHaveLength(2);
    
    // Images should be ordered by display_order
    expect(result[0].images[0].alt_text).toBe('Party balloons');
    expect(result[0].images[0].display_order).toBe(1);
    expect(result[0].images[1].alt_text).toBe('Birthday cake');
    expect(result[0].images[1].display_order).toBe(2);
  });

  it('should return multiple cards with their respective images', async () => {
    // Create first card
    const [card1] = await db.insert(birthdayCardsTable).values({
      title: 'Card One',
      message: 'Message one',
      recipient_name: 'Person1',
      sender_name: 'Sender1',
      is_active: true
    }).returning().execute();

    // Create second card
    const [card2] = await db.insert(birthdayCardsTable).values({
      title: 'Card Two',
      message: 'Message two',
      recipient_name: 'Person2',
      sender_name: 'Sender2',
      is_active: true
    }).returning().execute();

    // Add images to first card
    await db.insert(galleryImagesTable).values({
      card_id: card1.id,
      image_url: 'https://example.com/card1.jpg',
      alt_text: 'Card 1 image',
      display_order: 1
    }).execute();

    // Add images to second card
    await db.insert(galleryImagesTable).values([
      {
        card_id: card2.id,
        image_url: 'https://example.com/card2-1.jpg',
        alt_text: 'Card 2 image 1',
        display_order: 1
      },
      {
        card_id: card2.id,
        image_url: 'https://example.com/card2-2.jpg',
        alt_text: 'Card 2 image 2',
        display_order: 2
      }
    ]).execute();

    const result = await getBirthdayCards();

    expect(result).toHaveLength(2);
    
    // Find cards by title to avoid order dependency
    const cardOne = result.find(c => c.title === 'Card One');
    const cardTwo = result.find(c => c.title === 'Card Two');

    expect(cardOne).toBeDefined();
    expect(cardOne!.images).toHaveLength(1);
    expect(cardOne!.images[0].alt_text).toBe('Card 1 image');

    expect(cardTwo).toBeDefined();
    expect(cardTwo!.images).toHaveLength(2);
    expect(cardTwo!.images[0].alt_text).toBe('Card 2 image 1');
    expect(cardTwo!.images[1].alt_text).toBe('Card 2 image 2');
  });

  it('should handle cards without images', async () => {
    // Create card without images
    await db.insert(birthdayCardsTable).values({
      title: 'Simple Card',
      message: 'No photos needed',
      recipient_name: 'Simple Person',
      sender_name: 'Simple Sender',
      is_active: true
    }).execute();

    const result = await getBirthdayCards();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Simple Card');
    expect(result[0].images).toEqual([]);
  });

  it('should return cards ordered by creation date', async () => {
    // Create cards with specific timestamps to test ordering
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier
    
    await db.insert(birthdayCardsTable).values([
      {
        title: 'Newer Card',
        message: 'Created later',
        recipient_name: 'New Person',
        sender_name: 'New Sender',
        is_active: true,
        created_at: now
      },
      {
        title: 'Older Card',
        message: 'Created earlier',
        recipient_name: 'Old Person',
        sender_name: 'Old Sender',
        is_active: true,
        created_at: earlier
      }
    ]).execute();

    const result = await getBirthdayCards();

    expect(result).toHaveLength(2);
    // Should be ordered by created_at ascending (older first)
    expect(result[0].title).toBe('Older Card');
    expect(result[1].title).toBe('Newer Card');
  });

  it('should validate returned data structure', async () => {
    // Create complete test data
    const [card] = await db.insert(birthdayCardsTable).values({
      title: 'Test Card',
      message: 'Test Message',
      recipient_name: 'Test Recipient',
      sender_name: 'Test Sender',
      is_active: true
    }).returning().execute();

    await db.insert(galleryImagesTable).values({
      card_id: card.id,
      image_url: 'https://example.com/test.jpg',
      alt_text: 'Test image',
      display_order: 1
    }).execute();

    const result = await getBirthdayCards();

    expect(result).toHaveLength(1);
    const cardResult = result[0];

    // Validate card structure
    expect(typeof cardResult.id).toBe('number');
    expect(typeof cardResult.title).toBe('string');
    expect(typeof cardResult.message).toBe('string');
    expect(typeof cardResult.recipient_name).toBe('string');
    expect(typeof cardResult.sender_name).toBe('string');
    expect(cardResult.created_at).toBeInstanceOf(Date);
    expect(typeof cardResult.is_active).toBe('boolean');
    expect(Array.isArray(cardResult.images)).toBe(true);

    // Validate image structure
    expect(cardResult.images).toHaveLength(1);
    const imageResult = cardResult.images[0];
    expect(typeof imageResult.id).toBe('number');
    expect(typeof imageResult.card_id).toBe('number');
    expect(typeof imageResult.image_url).toBe('string');
    expect(typeof imageResult.alt_text).toBe('string');
    expect(typeof imageResult.display_order).toBe('number');
    expect(imageResult.created_at).toBeInstanceOf(Date);
  });
});
