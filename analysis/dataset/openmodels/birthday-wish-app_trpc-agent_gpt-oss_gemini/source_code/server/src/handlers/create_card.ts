import { type CreateCardInput, type Card } from '../schema';
import { db } from '../db';
import { cardsTable } from '../db/schema';

/**
 * Handler for creating a new birthday card.
 * Inserts a new row into the `cards` table and returns the created card.
 * The `photos` column is stored as a JSON string in the database and
 * converted back to an array of strings for the response.
 */
export const createCard = async (input: CreateCardInput): Promise<Card> => {
  try {
    const result = await db
      .insert(cardsTable)
      .values({
        message: input.message,
        photos: JSON.stringify(input.photos),
      })
      .returning()
      .execute();

    const inserted = result[0];
    return {
      ...inserted,
      photos: JSON.parse(inserted.photos), // Convert back to array of strings
    } as Card;
  } catch (error) {
    console.error('Failed to create card:', error);
    throw error;
  }
};
