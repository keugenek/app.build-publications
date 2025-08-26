import { db } from '../db';
import { birthdayCardsTable, photosTable } from '../db/schema';
import { type BirthdayCardWithPhotos } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getBirthdayCard(cardId: number): Promise<BirthdayCardWithPhotos | null> {
  try {
    // First, fetch the birthday card
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, cardId))
      .execute();

    // Return null if card not found
    if (cards.length === 0) {
      return null;
    }

    const card = cards[0];

    // Fetch associated photos ordered by display_order
    const photos = await db.select()
      .from(photosTable)
      .where(eq(photosTable.card_id, cardId))
      .orderBy(asc(photosTable.display_order))
      .execute();

    // Return the card with its photos
    return {
      id: card.id,
      recipient_name: card.recipient_name,
      message: card.message,
      created_at: card.created_at,
      updated_at: card.updated_at,
      photos: photos
    };
  } catch (error) {
    console.error('Failed to fetch birthday card:', error);
    throw error;
  }
}
