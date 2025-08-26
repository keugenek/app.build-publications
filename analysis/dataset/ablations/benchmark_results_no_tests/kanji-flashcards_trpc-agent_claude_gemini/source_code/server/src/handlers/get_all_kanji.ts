import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type Kanji } from '../schema';
import { desc } from 'drizzle-orm';

export const getAllKanji = async (): Promise<Kanji[]> => {
  try {
    // Query all kanji ordered by creation date (newest first)
    const results = await db.select()
      .from(kanjiTable)
      .orderBy(desc(kanjiTable.created_at))
      .execute();

    // Return results (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Failed to fetch all kanji:', error);
    throw error;
  }
};
