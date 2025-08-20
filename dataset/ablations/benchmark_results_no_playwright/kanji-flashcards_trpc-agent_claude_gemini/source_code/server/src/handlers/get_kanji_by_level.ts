import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type GetKanjiByLevelInput, type Kanji } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getKanjiByLevel = async (input: GetKanjiByLevelInput): Promise<Kanji[]> => {
  try {
    // Build query with JLPT level filter, ordering, and pagination
    const results = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.jlpt_level, input.jlpt_level))
      .orderBy(asc(kanjiTable.created_at))
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    // Return results (no numeric field conversions needed for kanji table)
    return results;
  } catch (error) {
    console.error('Failed to get kanji by level:', error);
    throw error;
  }
};
