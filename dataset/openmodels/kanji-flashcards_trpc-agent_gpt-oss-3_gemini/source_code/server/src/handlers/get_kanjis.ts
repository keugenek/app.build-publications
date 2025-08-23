import { db } from '../db';
import { kanjisTable } from '../db/schema';
import { type Kanji } from '../schema';

/**
 * Fetch all kanji entries from the database.
 * Returns an array of {@link Kanji} objects.
 */
export const getKanjis = async (): Promise<Kanji[]> => {
  try {
    // Select all records from the kanjis table
    const rows = await db.select().from(kanjisTable).execute();

    // Drizzle returns timestamps as Date objects, no numeric conversion needed.
    // Return the rows directly (shallow copy to avoid accidental mutation).
    return rows.map((row) => ({ ...row }));
  } catch (error) {
    console.error('Failed to fetch kanjis:', error);
    throw error;
  }
};
