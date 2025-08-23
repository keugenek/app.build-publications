import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput, type Kanji } from '../schema';

export const createKanji = async (input: CreateKanjiInput): Promise<Kanji> => {
  try {
    const result = await db.insert(kanjiTable)
      .values({
        kanji: input.kanji,
        meaning: input.meaning,
        onyomi: input.onyomi,
        kunyomi: input.kunyomi,
        jlpt_level: input.jlpt_level
      })
      .returning()
      .execute();

    const kanji = result[0];
    return {
      ...kanji,
      created_at: kanji.created_at
    };
  } catch (error) {
    console.error('Kanji creation failed:', error);
    throw error;
  }
};
