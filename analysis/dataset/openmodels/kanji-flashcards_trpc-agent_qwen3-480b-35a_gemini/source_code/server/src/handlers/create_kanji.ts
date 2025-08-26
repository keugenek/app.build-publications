import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput, type Kanji } from '../schema';

export const createKanji = async (input: CreateKanjiInput): Promise<Kanji> => {
  try {
    // Insert kanji record
    const result = await db.insert(kanjiTable)
      .values({
        character: input.character,
        meaning: input.meaning,
        kunReading: input.kunReading,
        onReading: input.onReading,
        jlptLevel: input.jlptLevel
      })
      .returning()
      .execute();

    // Map database result to schema type
    const kanji = result[0];
    return {
      id: kanji.id,
      character: kanji.character,
      meaning: kanji.meaning,
      kunReading: kanji.kunReading,
      onReading: kanji.onReading,
      jlptLevel: kanji.jlptLevel as Kanji['jlptLevel'],
      created_at: kanji.createdAt
    };
  } catch (error) {
    console.error('Kanji creation failed:', error);
    throw error;
  }
};
