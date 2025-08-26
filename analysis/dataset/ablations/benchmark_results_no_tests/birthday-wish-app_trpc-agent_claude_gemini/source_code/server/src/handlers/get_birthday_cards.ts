import { db } from '../db';
import { birthdayCardsTable, galleryImagesTable } from '../db/schema';
import { type BirthdayCardWithImages } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getBirthdayCards = async (): Promise<BirthdayCardWithImages[]> => {
  try {
    // Fetch all active birthday cards with their gallery images
    const results = await db.select()
      .from(birthdayCardsTable)
      .leftJoin(galleryImagesTable, eq(birthdayCardsTable.id, galleryImagesTable.card_id))
      .where(eq(birthdayCardsTable.is_active, true))
      .orderBy(asc(birthdayCardsTable.created_at), asc(galleryImagesTable.display_order))
      .execute();

    // Group results by card ID and build the response structure
    const cardMap = new Map<number, BirthdayCardWithImages>();

    for (const result of results) {
      const card = result.birthday_cards;
      const image = result.gallery_images;

      if (!cardMap.has(card.id)) {
        cardMap.set(card.id, {
          id: card.id,
          title: card.title,
          message: card.message,
          recipient_name: card.recipient_name,
          sender_name: card.sender_name,
          created_at: card.created_at,
          is_active: card.is_active,
          images: []
        });
      }

      // Add image if it exists (leftJoin may return null for cards without images)
      if (image) {
        cardMap.get(card.id)!.images.push({
          id: image.id,
          card_id: image.card_id,
          image_url: image.image_url,
          alt_text: image.alt_text,
          display_order: image.display_order,
          created_at: image.created_at
        });
      }
    }

    return Array.from(cardMap.values());
  } catch (error) {
    console.error('Failed to fetch birthday cards:', error);
    throw error;
  }
};
