import { db } from '../db';
import { photosTable, birthdayCardsTable } from '../db/schema';
import { type AddPhotoInput, type Photo } from '../schema';
import { eq, gte } from 'drizzle-orm';

export const addPhoto = async (input: AddPhotoInput): Promise<Photo> => {
  try {
    // Validate that the birthday card exists
    const existingCard = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, input.card_id))
      .execute();

    if (existingCard.length === 0) {
      throw new Error(`Birthday card with id ${input.card_id} not found`);
    }

    // Check if there are existing photos with the same or higher display_order
    const conflictingPhotos = await db.select()
      .from(photosTable)
      .where(
        eq(photosTable.card_id, input.card_id)
      )
      .execute();

    // Find photos that need to be shifted (same or higher display_order)
    const photosToShift = conflictingPhotos.filter(
      photo => photo.display_order >= input.display_order
    );

    // Shift existing photos if necessary
    if (photosToShift.length > 0) {
      for (const photo of photosToShift) {
        await db.update(photosTable)
          .set({ display_order: photo.display_order + 1 })
          .where(eq(photosTable.id, photo.id))
          .execute();
      }
    }

    // Insert the new photo
    const result = await db.insert(photosTable)
      .values({
        card_id: input.card_id,
        image_url: input.image_url,
        caption: input.caption,
        display_order: input.display_order
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Photo creation failed:', error);
    throw error;
  }
};
