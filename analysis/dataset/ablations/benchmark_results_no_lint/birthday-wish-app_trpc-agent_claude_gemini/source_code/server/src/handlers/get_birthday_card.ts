import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { type BirthdayCardWithPhotos } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getBirthdayCard = async (id: number): Promise<BirthdayCardWithPhotos | null> => {
  try {
    // First, get the birthday card
    const cardResults = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, id))
      .execute();

    if (cardResults.length === 0) {
      return null;
    }

    const card = cardResults[0];

    // Then, get all photos associated with this card, ordered by display_order
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, id))
      .orderBy(asc(photosTable.display_order))
      .execute();

    // Return the card with photos
    return {
      ...card,
      photos
    };
  } catch (error) {
    console.error('Failed to get birthday card:', error);
    throw error;
  }
};
