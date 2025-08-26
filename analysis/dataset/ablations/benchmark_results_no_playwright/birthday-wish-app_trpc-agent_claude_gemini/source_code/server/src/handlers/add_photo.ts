import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { type CreatePhotoInput, type Photo } from '../schema';
import { eq, and } from 'drizzle-orm';

export const addPhoto = async (input: CreatePhotoInput): Promise<Photo> => {
  try {
    // First, verify that the birthday card exists and is active
    const card = await db.select()
      .from(birthdayCardsTable)
      .where(
        and(
          eq(birthdayCardsTable.id, input.card_id),
          eq(birthdayCardsTable.is_active, true)
        )
      )
      .execute();

    if (card.length === 0) {
      throw new Error(`Birthday card with id ${input.card_id} not found or is inactive`);
    }

    // Insert the photo record
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
    console.error('Photo addition failed:', error);
    throw error;
  }
};
