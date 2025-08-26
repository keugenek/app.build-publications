import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Kanji, type GetKanjiByLevelInput } from '../schema';

export const getKanjiByLevel = async (input: GetKanjiByLevelInput): Promise<Kanji[]> => {
  try {
    const results = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.jlptLevel, input.jlptLevel))
      .execute();

    // Convert the results to match the schema type
    return results.map(kanji => ({
      ...kanji,
      created_at: kanji.createdAt
    }));
  } catch (error) {
    console.error('Failed to fetch kanji by level:', error);
    throw error;
  }
};
