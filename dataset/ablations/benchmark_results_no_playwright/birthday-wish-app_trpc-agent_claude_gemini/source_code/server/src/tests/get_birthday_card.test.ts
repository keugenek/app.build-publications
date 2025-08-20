import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { getBirthdayCard } from '../handlers/get_birthday_card';

describe('getBirthdayCard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a birthday card with photos', async () => {
    // Create a test birthday card
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        title: 'Happy Birthday!',
        message: 'Hope your day is wonderful!',
        recipient_name: 'John Doe',
        sender_name: 'Jane Smith',
        theme_color: '#ff69b4',
        is_active: true
      })
      .returning()
      .execute();

    const card = cardResult[0];

    // Create test photos for the card
    await db.insert(photosTable)
      .values([
        {
          card_id: card.id,
          image_url: 'https://example.com/photo1.jpg',
          caption: 'First photo',
          display_order: 1
        },
        {
          card_id: card.id,
          image_url: 'https://example.com/photo2.jpg',
          caption: 'Second photo',
          display_order: 2
        }
      ])
      .execute();

    // Get the birthday card
    const result = await getBirthdayCard(card.id);

    expect(result).toBeDefined();
    expect(result!.card.id).toEqual(card.id);
    expect(result!.card.title).toEqual('Happy Birthday!');
    expect(result!.card.message).toEqual('Hope your day is wonderful!');
    expect(result!.card.recipient_name).toEqual('John Doe');
    expect(result!.card.sender_name).toEqual('Jane Smith');
    expect(result!.card.theme_color).toEqual('#ff69b4');
    expect(result!.card.is_active).toBe(true);
    expect(result!.card.created_at).toBeInstanceOf(Date);

    // Verify photos are returned in correct order
    expect(result!.photos).toHaveLength(2);
    expect(result!.photos[0].image_url).toEqual('https://example.com/photo1.jpg');
    expect(result!.photos[0].caption).toEqual('First photo');
    expect(result!.photos[0].display_order).toEqual(1);
    expect(result!.photos[1].image_url).toEqual('https://example.com/photo2.jpg');
    expect(result!.photos[1].caption).toEqual('Second photo');
    expect(result!.photos[1].display_order).toEqual(2);
  });

  it('should return card with empty photos array when no photos exist', async () => {
    // Create a test birthday card without photos
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        title: 'Simple Card',
        message: 'No photos here!',
        recipient_name: 'Alice',
        sender_name: 'Bob',
        theme_color: '#blue',
        is_active: true
      })
      .returning()
      .execute();

    const card = cardResult[0];

    // Get the birthday card
    const result = await getBirthdayCard(card.id);

    expect(result).toBeDefined();
    expect(result!.card.id).toEqual(card.id);
    expect(result!.card.title).toEqual('Simple Card');
    expect(result!.photos).toHaveLength(0);
  });

  it('should return null for non-existent card', async () => {
    const result = await getBirthdayCard(999);
    expect(result).toBeNull();
  });

  it('should return null for inactive card', async () => {
    // Create an inactive birthday card
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        title: 'Inactive Card',
        message: 'This card is inactive',
        recipient_name: 'Test User',
        sender_name: 'Test Sender',
        theme_color: '#red',
        is_active: false
      })
      .returning()
      .execute();

    const card = cardResult[0];

    // Try to get the inactive card
    const result = await getBirthdayCard(card.id);
    expect(result).toBeNull();
  });

  it('should return photos ordered by display_order', async () => {
    // Create a test birthday card
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        title: 'Ordered Photos',
        message: 'Testing photo order',
        recipient_name: 'Test User',
        sender_name: 'Test Sender',
        theme_color: '#green',
        is_active: true
      })
      .returning()
      .execute();

    const card = cardResult[0];

    // Create photos in non-sequential order to test ordering
    await db.insert(photosTable)
      .values([
        {
          card_id: card.id,
          image_url: 'https://example.com/photo3.jpg',
          caption: 'Third photo',
          display_order: 3
        },
        {
          card_id: card.id,
          image_url: 'https://example.com/photo1.jpg',
          caption: 'First photo',
          display_order: 1
        },
        {
          card_id: card.id,
          image_url: 'https://example.com/photo2.jpg',
          caption: 'Second photo',
          display_order: 2
        }
      ])
      .execute();

    // Get the birthday card
    const result = await getBirthdayCard(card.id);

    expect(result).toBeDefined();
    expect(result!.photos).toHaveLength(3);

    // Verify photos are ordered correctly
    expect(result!.photos[0].display_order).toEqual(1);
    expect(result!.photos[0].caption).toEqual('First photo');
    expect(result!.photos[1].display_order).toEqual(2);
    expect(result!.photos[1].caption).toEqual('Second photo');
    expect(result!.photos[2].display_order).toEqual(3);
    expect(result!.photos[2].caption).toEqual('Third photo');
  });

  it('should handle photos with null captions', async () => {
    // Create a test birthday card
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        title: 'Card with null caption',
        message: 'Testing null caption',
        recipient_name: 'Test User',
        sender_name: 'Test Sender',
        theme_color: '#purple',
        is_active: true
      })
      .returning()
      .execute();

    const card = cardResult[0];

    // Create a photo with null caption
    await db.insert(photosTable)
      .values({
        card_id: card.id,
        image_url: 'https://example.com/photo_no_caption.jpg',
        caption: null,
        display_order: 1
      })
      .execute();

    // Get the birthday card
    const result = await getBirthdayCard(card.id);

    expect(result).toBeDefined();
    expect(result!.photos).toHaveLength(1);
    expect(result!.photos[0].caption).toBeNull();
    expect(result!.photos[0].image_url).toEqual('https://example.com/photo_no_caption.jpg');
  });

  it('should handle cards with default theme color', async () => {
    // Create a test birthday card using default theme color
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        title: 'Default Theme',
        message: 'Using default pink theme',
        recipient_name: 'Test User',
        sender_name: 'Test Sender'
        // theme_color will use default #ff69b4
        // is_active will use default true
      })
      .returning()
      .execute();

    const card = cardResult[0];

    // Get the birthday card
    const result = await getBirthdayCard(card.id);

    expect(result).toBeDefined();
    expect(result!.card.theme_color).toEqual('#ff69b4');
    expect(result!.card.is_active).toBe(true);
  });
});
