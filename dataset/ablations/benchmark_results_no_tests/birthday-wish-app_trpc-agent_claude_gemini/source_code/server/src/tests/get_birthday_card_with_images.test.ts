import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, galleryImagesTable } from '../db/schema';
import { getBirthdayCardWithImages } from '../handlers/get_birthday_card_with_images';

// Test data
const testCard = {
  title: 'Happy Birthday!',
  message: 'Hope you have a wonderful day filled with joy and celebration!',
  recipient_name: 'Alice Johnson',
  sender_name: 'Bob Smith',
};

const testImages = [
  {
    image_url: 'https://example.com/image1.jpg',
    alt_text: 'Birthday cake with candles',
    display_order: 2
  },
  {
    image_url: 'https://example.com/image2.jpg',
    alt_text: 'Party balloons',
    display_order: 1
  },
  {
    image_url: 'https://example.com/image3.jpg',
    alt_text: 'Gift boxes',
    display_order: 3
  }
];

describe('getBirthdayCardWithImages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return birthday card with images ordered by display_order', async () => {
    // Create a birthday card
    const cardResult = await db.insert(birthdayCardsTable)
      .values(testCard)
      .returning()
      .execute();

    const cardId = cardResult[0].id;

    // Add gallery images for the card
    const imageValues = testImages.map(img => ({
      ...img,
      card_id: cardId
    }));

    await db.insert(galleryImagesTable)
      .values(imageValues)
      .execute();

    // Get the card with images
    const result = await getBirthdayCardWithImages(cardId);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(cardId);
    expect(result!.title).toEqual(testCard.title);
    expect(result!.message).toEqual(testCard.message);
    expect(result!.recipient_name).toEqual(testCard.recipient_name);
    expect(result!.sender_name).toEqual(testCard.sender_name);
    expect(result!.is_active).toEqual(true); // Default value
    expect(result!.created_at).toBeInstanceOf(Date);

    // Verify images are returned in correct order (by display_order)
    expect(result!.images).toHaveLength(3);
    expect(result!.images[0].display_order).toEqual(1);
    expect(result!.images[0].alt_text).toEqual('Party balloons');
    expect(result!.images[1].display_order).toEqual(2);
    expect(result!.images[1].alt_text).toEqual('Birthday cake with candles');
    expect(result!.images[2].display_order).toEqual(3);
    expect(result!.images[2].alt_text).toEqual('Gift boxes');

    // Verify each image has all required fields
    result!.images.forEach(image => {
      expect(image.id).toBeDefined();
      expect(image.card_id).toEqual(cardId);
      expect(image.image_url).toMatch(/^https:\/\/example\.com\//);
      expect(image.alt_text).toBeDefined();
      expect(image.display_order).toBeDefined();
      expect(image.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return birthday card with empty images array when no images exist', async () => {
    // Create a birthday card without images
    const cardResult = await db.insert(birthdayCardsTable)
      .values(testCard)
      .returning()
      .execute();

    const cardId = cardResult[0].id;

    // Get the card (should have no images)
    const result = await getBirthdayCardWithImages(cardId);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(cardId);
    expect(result!.title).toEqual(testCard.title);
    expect(result!.images).toHaveLength(0);
    expect(Array.isArray(result!.images)).toBe(true);
  });

  it('should return null when card does not exist', async () => {
    // Try to get a non-existent card
    const result = await getBirthdayCardWithImages(99999);

    expect(result).toBeNull();
  });

  it('should handle inactive cards correctly', async () => {
    // Create an inactive birthday card
    const inactiveCard = {
      ...testCard,
      is_active: false
    };

    const cardResult = await db.insert(birthdayCardsTable)
      .values(inactiveCard)
      .returning()
      .execute();

    const cardId = cardResult[0].id;

    // Add one image
    await db.insert(galleryImagesTable)
      .values({
        card_id: cardId,
        image_url: 'https://example.com/inactive.jpg',
        alt_text: 'Inactive card image',
        display_order: 1
      })
      .execute();

    // Get the card (should still return even if inactive)
    const result = await getBirthdayCardWithImages(cardId);

    expect(result).toBeTruthy();
    expect(result!.is_active).toEqual(false);
    expect(result!.images).toHaveLength(1);
  });

  it('should handle multiple cards with different images', async () => {
    // Create two different cards
    const card1Result = await db.insert(birthdayCardsTable)
      .values({
        ...testCard,
        title: 'Card 1'
      })
      .returning()
      .execute();

    const card2Result = await db.insert(birthdayCardsTable)
      .values({
        ...testCard,
        title: 'Card 2'
      })
      .returning()
      .execute();

    const card1Id = card1Result[0].id;
    const card2Id = card2Result[0].id;

    // Add different images to each card
    await db.insert(galleryImagesTable)
      .values([
        {
          card_id: card1Id,
          image_url: 'https://example.com/card1.jpg',
          alt_text: 'Card 1 image',
          display_order: 1
        },
        {
          card_id: card2Id,
          image_url: 'https://example.com/card2.jpg',
          alt_text: 'Card 2 image',
          display_order: 1
        }
      ])
      .execute();

    // Get each card separately
    const result1 = await getBirthdayCardWithImages(card1Id);
    const result2 = await getBirthdayCardWithImages(card2Id);

    // Verify each card only gets its own images
    expect(result1!.title).toEqual('Card 1');
    expect(result1!.images).toHaveLength(1);
    expect(result1!.images[0].alt_text).toEqual('Card 1 image');

    expect(result2!.title).toEqual('Card 2');
    expect(result2!.images).toHaveLength(1);
    expect(result2!.images[0].alt_text).toEqual('Card 2 image');
  });

  it('should handle images with same display_order correctly', async () => {
    // Create a birthday card
    const cardResult = await db.insert(birthdayCardsTable)
      .values(testCard)
      .returning()
      .execute();

    const cardId = cardResult[0].id;

    // Add images with same display_order
    await db.insert(galleryImagesTable)
      .values([
        {
          card_id: cardId,
          image_url: 'https://example.com/same1.jpg',
          alt_text: 'Same order 1',
          display_order: 1
        },
        {
          card_id: cardId,
          image_url: 'https://example.com/same2.jpg',
          alt_text: 'Same order 2',
          display_order: 1
        }
      ])
      .execute();

    // Get the card
    const result = await getBirthdayCardWithImages(cardId);

    expect(result!.images).toHaveLength(2);
    // Both should have display_order 1, order may vary but both should be present
    expect(result!.images.every(img => img.display_order === 1)).toBe(true);
    expect(result!.images.map(img => img.alt_text)).toContain('Same order 1');
    expect(result!.images.map(img => img.alt_text)).toContain('Same order 2');
  });
});
