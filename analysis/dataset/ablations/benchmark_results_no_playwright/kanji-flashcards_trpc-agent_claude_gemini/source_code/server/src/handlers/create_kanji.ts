import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput, type Kanji } from '../schema';
import { eq } from 'drizzle-orm';

export const createKanji = async (input: CreateKanjiInput): Promise<Kanji> => {
  try {
    // Check if kanji character already exists
    const existingKanji = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.character, input.character))
      .limit(1)
      .execute();

    if (existingKanji.length > 0) {
      throw new Error(`Kanji character '${input.character}' already exists`);
    }

    // Insert new kanji record
    const result = await db.insert(kanjiTable)
      .values({
        character: input.character,
        meaning_english: input.meaning_english,
        reading_hiragana: input.reading_hiragana,
        reading_katakana: input.reading_katakana,
        jlpt_level: input.jlpt_level
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Kanji creation failed:', error);
    throw error;
  }
};
