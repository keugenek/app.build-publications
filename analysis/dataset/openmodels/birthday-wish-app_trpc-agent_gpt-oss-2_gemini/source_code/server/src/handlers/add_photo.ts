import { type AddPhotoInput, type Photo } from '../schema';
import { db } from '../db';
import { photos } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Placeholder handler to add a photo to a card.
 * Real implementation would insert into the DB and return the inserted photo.
 */
export const addPhoto = async (input: AddPhotoInput): Promise<Photo> => {
  // Insert photo into the database and return the inserted record
  const result = await db
    .insert(photos)
    .values({
      card_id: input.card_id,
      url: input.url,
      // Explicitly store null if caption is undefined
      caption: input.caption ?? null,
    })
    .returning()
    .execute();

  const inserted = result[0];
  // Return shape matches schema Photo type
  return {
    id: inserted.id,
    card_id: inserted.card_id,
    url: inserted.url,
    caption: inserted.caption ?? null,
  } as Photo;
};

/**
 * Placeholder handler to retrieve all photos belonging to a specific card.
 */
export const getPhotosByCard = async (cardId: number): Promise<Photo[]> => {
  const rows = await db
    .select()
    .from(photos)
    .where(eq(photos.card_id, cardId))
    .execute();
  // Map to Photo type (caption may be null)
  return rows.map(row => ({
    id: row.id,
    card_id: row.card_id,
    url: row.url,
    caption: row.caption ?? null,
  } as Photo));
};
