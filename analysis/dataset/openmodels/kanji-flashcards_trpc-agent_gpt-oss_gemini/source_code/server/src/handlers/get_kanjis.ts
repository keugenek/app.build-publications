import { db } from '../db';
import { kanjis } from '../db/schema';
import { type Kanji } from '../schema';

// Fetch all kanjis from the database
export const getKanjis = async (): Promise<Kanji[]> => {
  try {
    const results = await db.select().from(kanjis).execute();
    // Drizzle returns Date for timestamp, no numeric conversion needed
    return results as unknown as Kanji[];
  } catch (error) {
    console.error('Failed to fetch kanjis:', error);
    throw error;
  }
};
