import { db } from '../db';
import { birthdayCardsTable, galleryImagesTable } from '../db/schema';
import { type AddGalleryImageInput, type GalleryImage } from '../schema';
import { eq } from 'drizzle-orm';

export const addGalleryImage = async (input: AddGalleryImageInput): Promise<GalleryImage> => {
  try {
    // Validate that the birthday card exists
    const existingCard = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, input.card_id))
      .execute();

    if (existingCard.length === 0) {
      throw new Error(`Birthday card with id ${input.card_id} does not exist`);
    }

    // Insert the gallery image
    const result = await db.insert(galleryImagesTable)
      .values({
        card_id: input.card_id,
        image_url: input.image_url,
        alt_text: input.alt_text,
        display_order: input.display_order
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Gallery image creation failed:', error);
    throw error;
  }
};
