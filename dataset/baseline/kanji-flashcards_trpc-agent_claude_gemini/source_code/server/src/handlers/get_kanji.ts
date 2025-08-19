import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type GetKanjiQuery, type Kanji } from '../schema';
import { eq } from 'drizzle-orm';

export const getKanji = async (query: GetKanjiQuery): Promise<Kanji[]> => {
  try {
    // Build the complete query based on conditions
    if (query.jlpt_level) {
      // Query with JLPT level filter
      const results = await db.select()
        .from(kanjiTable)
        .where(eq(kanjiTable.jlpt_level, query.jlpt_level))
        .limit(query.limit)
        .offset(query.offset)
        .execute();
      return results;
    } else {
      // Query without filter
      const results = await db.select()
        .from(kanjiTable)
        .limit(query.limit)
        .offset(query.offset)
        .execute();
      return results;
    }
  } catch (error) {
    console.error('Failed to fetch kanji:', error);
    throw error;
  }
};
