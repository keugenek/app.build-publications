import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type Kanji } from '../schema';

export const getKanji = async (): Promise<Kanji[]> => {
  try {
    const results = await db.select()
      .from(kanjiTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(kanji => ({
      ...kanji,
      // No numeric conversions needed for kanji table
    }));
  } catch (error) {
    console.error('Failed to fetch kanji:', error);
    throw error;
  }
};
