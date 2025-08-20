import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, galleryImagesTable } from '../db/schema';
import { type AddGalleryImageInput } from '../schema';
import { addGalleryImage } from '../handlers/add_gallery_image';
import { eq } from 'drizzle-orm';

// Test input for gallery image
const testImageInput: AddGalleryImageInput = {
  card_id: 1, // Will be set dynamically after creating a card
  image_url: 'https://example.com/birthday-image.jpg',
  alt_text: 'Happy birthday celebration photo',
  display_order: 0
};

describe('addGalleryImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCardId: number;

  beforeEach(async () => {
    // Create a birthday card as prerequisite data
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        title: 'Test Birthday Card',
        message: 'Happy Birthday!',
        recipient_name: 'John Doe',
        sender_name: 'Jane Smith'
      })
      .returning()
      .execute();
    
    testCardId = cardResult[0].id;
  });

  it('should add a gallery image to an existing card', async () => {
    const input = { ...testImageInput, card_id: testCardId };
    const result = await addGalleryImage(input);

    // Basic field validation
    expect(result.card_id).toEqual(testCardId);
    expect(result.image_url).toEqual('https://example.com/birthday-image.jpg');
    expect(result.alt_text).toEqual('Happy birthday celebration photo');
    expect(result.display_order).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save gallery image to database', async () => {
    const input = { ...testImageInput, card_id: testCardId };
    const result = await addGalleryImage(input);

    // Query using proper drizzle syntax
    const images = await db.select()
      .from(galleryImagesTable)
      .where(eq(galleryImagesTable.id, result.id))
      .execute();

    expect(images).toHaveLength(1);
    expect(images[0].card_id).toEqual(testCardId);
    expect(images[0].image_url).toEqual('https://example.com/birthday-image.jpg');
    expect(images[0].alt_text).toEqual('Happy birthday celebration photo');
    expect(images[0].display_order).toEqual(0);
    expect(images[0].created_at).toBeInstanceOf(Date);
  });

  it('should add multiple images with different display orders', async () => {
    const firstImage = { ...testImageInput, card_id: testCardId, display_order: 0 };
    const secondImage = { 
      ...testImageInput, 
      card_id: testCardId, 
      image_url: 'https://example.com/second-image.jpg',
      alt_text: 'Second celebration photo',
      display_order: 1 
    };

    const result1 = await addGalleryImage(firstImage);
    const result2 = await addGalleryImage(secondImage);

    // Verify both images were created
    expect(result1.display_order).toEqual(0);
    expect(result2.display_order).toEqual(1);

    // Query all images for the card
    const images = await db.select()
      .from(galleryImagesTable)
      .where(eq(galleryImagesTable.card_id, testCardId))
      .execute();

    expect(images).toHaveLength(2);
    expect(images.some(img => img.display_order === 0)).toBe(true);
    expect(images.some(img => img.display_order === 1)).toBe(true);
  });

  it('should throw error when card does not exist', async () => {
    const input = { ...testImageInput, card_id: 999999 }; // Non-existent card ID

    await expect(addGalleryImage(input)).rejects.toThrow(/birthday card with id 999999 does not exist/i);
  });

  it('should handle valid URL formats correctly', async () => {
    const httpsInput = { 
      ...testImageInput, 
      card_id: testCardId,
      image_url: 'https://secure-cdn.example.com/images/birthday/photo123.png'
    };
    
    const result = await addGalleryImage(httpsInput);

    expect(result.image_url).toEqual('https://secure-cdn.example.com/images/birthday/photo123.png');
  });

  it('should handle zero display order correctly', async () => {
    const input = { 
      ...testImageInput, 
      card_id: testCardId,
      display_order: 0
    };
    
    const result = await addGalleryImage(input);

    expect(result.display_order).toEqual(0);
    expect(typeof result.display_order).toBe('number');
  });

  it('should preserve exact alt text content', async () => {
    const input = { 
      ...testImageInput, 
      card_id: testCardId,
      alt_text: 'Special characters: áéíóú & symbols $@#!'
    };
    
    const result = await addGalleryImage(input);

    expect(result.alt_text).toEqual('Special characters: áéíóú & symbols $@#!');
  });
});
