import { type UpdateCardInput, type Card } from '../schema';
import { db } from '../db';
import { cardsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Updates an existing birthday card in the `cards` table.
 * Only the fields provided in `input` are updated.
 * The `photos` column stores a JSON array as text, so the array is stringified on write
 * and parsed back to an array on read.
 */
export const updateCard = async (input: UpdateCardInput): Promise<Card> => {
  try {
    // Build partial update object based on optional fields
    const updateData: Partial<typeof cardsTable.$inferInsert> = {};
    if (input.message !== undefined) {
      updateData.message = input.message;
    }
    if (input.photos !== undefined) {
      // Store as JSON string
      updateData.photos = JSON.stringify(input.photos);
    }

    // Perform the update and return the updated row
    const result = await db
      .update(cardsTable)
      .set(updateData)
      .where(eq(cardsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Card with id ${input.id} not found`);
    }

    const raw = result[0];
    // Parse the photos JSON back to an array
    const updatedCard: Card = {
      id: raw.id,
      message: raw.message,
      photos: JSON.parse(raw.photos),
      created_at: raw.created_at,
    };
    return updatedCard;
  } catch (error) {
    console.error('Update card failed:', error);
    throw error;
  }
};
