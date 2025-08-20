import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput, type Kanji } from '../schema';

export async function createKanji(input: CreateKanjiInput): Promise<Kanji> {
  try {
    // Insert kanji record
    const result = await db.insert(kanjiTable)
      .values({
        character: input.character,
        meaning: input.meaning,
        on_reading: input.on_reading,
        kun_reading: input.kun_reading,
        jlpt_level: input.jlpt_level
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Kanji creation failed:', error);
    throw error;
  }
}
