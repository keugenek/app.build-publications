import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { type BirthdayCardWithPhotos } from '../schema';
import { eq, and, asc } from 'drizzle-orm';

export const getBirthdayCard = async (cardId: number): Promise<BirthdayCardWithPhotos | null> => {
  try {
    // First, get the birthday card and ensure it's active
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(and(
        eq(birthdayCardsTable.id, cardId),
        eq(birthdayCardsTable.is_active, true)
      ))
      .execute();

    // Return null if card not found or not active
    if (cards.length === 0) {
      return null;
    }

    const card = cards[0];

    // Get associated photos ordered by display_order
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, cardId))
      .orderBy(asc(photosTable.display_order))
      .execute();

    return {
      card,
      photos
    };
  } catch (error) {
    console.error('Failed to get birthday card:', error);
    throw error;
  }
};
