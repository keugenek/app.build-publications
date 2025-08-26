import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { type BirthdayCardWithPhotos } from '../schema';
import { getBirthdayCard } from '../handlers/get_birthday_card';
import { eq } from 'drizzle-orm';

describe('getBirthdayCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve a birthday card with photos ordered by display_order', async () => {
    // Create a birthday card
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Alice Johnson',
        message: 'Happy Birthday! Hope your day is amazing!',
        sender_name: 'Bob Smith',
        theme: 'confetti'
      })
      .returning()
      .execute();

    const cardId = cardResult[0].id;

    // Add photos with different display orders
    await db.insert(photosTable)
      .values([
        {
          card_id: cardId,
          image_url: 'https://example.com/photo3.jpg',
          caption: 'Third photo',
          display_order: 2
        },
        {
          card_id: cardId,
          image_url: 'https://example.com/photo1.jpg',
          caption: 'First photo',
          display_order: 0
        },
        {
          card_id: cardId,
          image_url: 'https://example.com/photo2.jpg',
          caption: null,
          display_order: 1
        }
      ])
      .execute();

    // Retrieve the card with photos
    const result = await getBirthdayCard(cardId);

    // Verify card data
    expect(result).not.toBeNull();
    expect(result!.id).toBe(cardId);
    expect(result!.recipient_name).toBe('Alice Johnson');
    expect(result!.message).toBe('Happy Birthday! Hope your day is amazing!');
    expect(result!.sender_name).toBe('Bob Smith');
    expect(result!.theme).toBe('confetti');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify photos are included and properly ordered
    expect(result!.photos).toHaveLength(3);
    expect(result!.photos[0].display_order).toBe(0);
    expect(result!.photos[0].image_url).toBe('https://example.com/photo1.jpg');
    expect(result!.photos[0].caption).toBe('First photo');

    expect(result!.photos[1].display_order).toBe(1);
    expect(result!.photos[1].image_url).toBe('https://example.com/photo2.jpg');
    expect(result!.photos[1].caption).toBeNull();

    expect(result!.photos[2].display_order).toBe(2);
    expect(result!.photos[2].image_url).toBe('https://example.com/photo3.jpg');
    expect(result!.photos[2].caption).toBe('Third photo');
  });

  it('should retrieve a birthday card without photos', async () => {
    // Create a birthday card without photos
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Charlie Brown',
        message: 'Another year older, another year wiser!',
        sender_name: 'Snoopy',
        theme: 'balloons'
      })
      .returning()
      .execute();

    const cardId = cardResult[0].id;

    // Retrieve the card
    const result = await getBirthdayCard(cardId);

    // Verify card data
    expect(result).not.toBeNull();
    expect(result!.id).toBe(cardId);
    expect(result!.recipient_name).toBe('Charlie Brown');
    expect(result!.message).toBe('Another year older, another year wiser!');
    expect(result!.sender_name).toBe('Snoopy');
    expect(result!.theme).toBe('balloons');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify photos array is empty
    expect(result!.photos).toHaveLength(0);
    expect(Array.isArray(result!.photos)).toBe(true);
  });

  it('should return null for non-existent birthday card', async () => {
    const result = await getBirthdayCard(99999);

    expect(result).toBeNull();
  });

  it('should handle card with single photo', async () => {
    // Create a birthday card
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Diana Prince',
        message: 'Wishing you all the best on your special day!',
        sender_name: 'Bruce Wayne',
        theme: 'sparkles'
      })
      .returning()
      .execute();

    const cardId = cardResult[0].id;

    // Add single photo
    await db.insert(photosTable)
      .values({
        card_id: cardId,
        image_url: 'https://example.com/single-photo.jpg',
        caption: 'Birthday celebration',
        display_order: 0
      })
      .execute();

    // Retrieve the card
    const result = await getBirthdayCard(cardId);

    // Verify card data
    expect(result).not.toBeNull();
    expect(result!.id).toBe(cardId);
    expect(result!.recipient_name).toBe('Diana Prince');
    expect(result!.theme).toBe('sparkles');

    // Verify single photo
    expect(result!.photos).toHaveLength(1);
    expect(result!.photos[0].image_url).toBe('https://example.com/single-photo.jpg');
    expect(result!.photos[0].caption).toBe('Birthday celebration');
    expect(result!.photos[0].display_order).toBe(0);
    expect(result!.photos[0].created_at).toBeInstanceOf(Date);
  });

  it('should not return photos from other cards', async () => {
    // Create two birthday cards
    const card1Result = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Card One Recipient',
        message: 'First card message',
        sender_name: 'Sender One',
        theme: 'confetti'
      })
      .returning()
      .execute();

    const card2Result = await db.insert(birthdayCardsTable)
      .values({
        recipient_name: 'Card Two Recipient',
        message: 'Second card message',
        sender_name: 'Sender Two',
        theme: 'balloons'
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
          image_url: 'https://example.com/card1-photo.jpg',
          caption: 'Photo for card 1',
          display_order: 0
        },
        {
          card_id: card2Id,
          image_url: 'https://example.com/card2-photo.jpg',
          caption: 'Photo for card 2',
          display_order: 0
        }
      ])
      .execute();

    // Retrieve first card
    const result1 = await getBirthdayCard(card1Id);

    // Verify it only contains its own photo
    expect(result1).not.toBeNull();
    expect(result1!.photos).toHaveLength(1);
    expect(result1!.photos[0].image_url).toBe('https://example.com/card1-photo.jpg');
    expect(result1!.photos[0].caption).toBe('Photo for card 1');

    // Retrieve second card
    const result2 = await getBirthdayCard(card2Id);

    // Verify it only contains its own photo
    expect(result2).not.toBeNull();
    expect(result2!.photos).toHaveLength(1);
    expect(result2!.photos[0].image_url).toBe('https://example.com/card2-photo.jpg');
    expect(result2!.photos[0].caption).toBe('Photo for card 2');
  });
});
