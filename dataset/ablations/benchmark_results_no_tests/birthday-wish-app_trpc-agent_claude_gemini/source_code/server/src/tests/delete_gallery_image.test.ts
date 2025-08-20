import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdayCardsTable, galleryImagesTable } from '../db/schema';
import { deleteGalleryImage } from '../handlers/delete_gallery_image';
import { eq } from 'drizzle-orm';

describe('deleteGalleryImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing gallery image and return true', async () => {
    // Create a birthday card first
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        title: 'Test Card',
        message: 'Test message',
        recipient_name: 'John Doe',
        sender_name: 'Jane Smith'
      })
      .returning()
      .execute();

    // Create a gallery image
    const imageResult = await db.insert(galleryImagesTable)
      .values({
        card_id: cardResult[0].id,
        image_url: 'https://example.com/image.jpg',
        alt_text: 'Test image',
        display_order: 1
      })
      .returning()
      .execute();

    const imageId = imageResult[0].id;

    // Delete the image
    const result = await deleteGalleryImage(imageId);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify the image was actually deleted from the database
    const deletedImages = await db.select()
      .from(galleryImagesTable)
      .where(eq(galleryImagesTable.id, imageId))
      .execute();

    expect(deletedImages).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent image', async () => {
    // Try to delete an image that doesn't exist
    const result = await deleteGalleryImage(99999);

    // Should return false indicating no record was deleted
    expect(result).toBe(false);
  });

  it('should not affect other gallery images when deleting one', async () => {
    // Create a birthday card first
    const cardResult = await db.insert(birthdayCardsTable)
      .values({
        title: 'Test Card',
        message: 'Test message',
        recipient_name: 'John Doe',
        sender_name: 'Jane Smith'
      })
      .returning()
      .execute();

    // Create two gallery images
    const imageResults = await db.insert(galleryImagesTable)
      .values([
        {
          card_id: cardResult[0].id,
          image_url: 'https://example.com/image1.jpg',
          alt_text: 'First image',
          display_order: 1
        },
        {
          card_id: cardResult[0].id,
          image_url: 'https://example.com/image2.jpg',
          alt_text: 'Second image',
          display_order: 2
        }
      ])
      .returning()
      .execute();

    const firstImageId = imageResults[0].id;
    const secondImageId = imageResults[1].id;

    // Delete only the first image
    const result = await deleteGalleryImage(firstImageId);

    expect(result).toBe(true);

    // Verify first image is deleted
    const deletedImages = await db.select()
      .from(galleryImagesTable)
      .where(eq(galleryImagesTable.id, firstImageId))
      .execute();

    expect(deletedImages).toHaveLength(0);

    // Verify second image still exists
    const remainingImages = await db.select()
      .from(galleryImagesTable)
      .where(eq(galleryImagesTable.id, secondImageId))
      .execute();

    expect(remainingImages).toHaveLength(1);
    expect(remainingImages[0].alt_text).toBe('Second image');
  });

  it('should handle deleting images from different cards independently', async () => {
    // Create two birthday cards
    const cardResults = await db.insert(birthdayCardsTable)
      .values([
        {
          title: 'First Card',
          message: 'First message',
          recipient_name: 'John Doe',
          sender_name: 'Jane Smith'
        },
        {
          title: 'Second Card',
          message: 'Second message',
          recipient_name: 'Alice Brown',
          sender_name: 'Bob Wilson'
        }
      ])
      .returning()
      .execute();

    // Create images for both cards
    const imageResults = await db.insert(galleryImagesTable)
      .values([
        {
          card_id: cardResults[0].id,
          image_url: 'https://example.com/card1-image.jpg',
          alt_text: 'Card 1 image',
          display_order: 1
        },
        {
          card_id: cardResults[1].id,
          image_url: 'https://example.com/card2-image.jpg',
          alt_text: 'Card 2 image',
          display_order: 1
        }
      ])
      .returning()
      .execute();

    // Delete image from first card
    const result = await deleteGalleryImage(imageResults[0].id);

    expect(result).toBe(true);

    // Verify only the first card's image was deleted
    const allImages = await db.select()
      .from(galleryImagesTable)
      .execute();

    expect(allImages).toHaveLength(1);
    expect(allImages[0].card_id).toBe(cardResults[1].id);
    expect(allImages[0].alt_text).toBe('Card 2 image');
  });
});
