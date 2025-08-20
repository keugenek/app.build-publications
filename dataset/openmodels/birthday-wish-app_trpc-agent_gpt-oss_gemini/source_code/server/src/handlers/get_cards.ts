import { db } from '../db';
import { cardsTable } from '../db/schema';
import { type Card } from '../schema';

/**
 * Handler to fetch all birthday cards from the database.
 * It parses the `photos` JSON string into an array of URLs.
 */
export const getCards = async (): Promise<Card[]> => {
  try {
    const rows = await db.select().from(cardsTable).execute();
    // Convert the stored JSON string for photos back to an array
    return rows.map(row => ({
      id: row.id,
      message: row.message,
      photos: JSON.parse(row.photos) as string[],
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error('Fetching cards failed:', error);
    throw error;
  }
};
