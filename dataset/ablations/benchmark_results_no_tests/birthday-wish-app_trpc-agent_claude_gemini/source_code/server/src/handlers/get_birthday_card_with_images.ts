import { db } from '../db';
import { birthdayCardsTable, galleryImagesTable } from '../db/schema';
import { type BirthdayCardWithImages } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getBirthdayCardWithImages(cardId: number): Promise<BirthdayCardWithImages | null> {
  try {
    // First, get the birthday card
    const cards = await db.select()
      .from(birthdayCardsTable)
      .where(eq(birthdayCardsTable.id, cardId))
      .execute();

    if (cards.length === 0) {
      return null;
    }

    const card = cards[0];

    // Get all gallery images for this card, ordered by display_order
    const images = await db.select()
      .from(galleryImagesTable)
      .where(eq(galleryImagesTable.card_id, cardId))
      .orderBy(asc(galleryImagesTable.display_order))
      .execute();

    // Return the card with its images
    return {
      id: card.id,
      title: card.title,
      message: card.message,
      recipient_name: card.recipient_name,
      sender_name: card.sender_name,
      created_at: card.created_at,
      is_active: card.is_active,
      images: images
    };
  } catch (error) {
    console.error('Failed to get birthday card with images:', error);
    throw error;
  }
}
