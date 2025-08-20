import { type CreateKanjiInput, type Kanji } from '../schema';

import { db } from '../db';
import { kanjis } from '../db/schema';
import { eq } from 'drizzle-orm';

// Handler for creating a kanji entry in the database
export const createKanji = async (input: CreateKanjiInput): Promise<Kanji> => {
  try {
    // Insert new kanji record and return the created row
    const result = await db
      .insert(kanjis)
      .values({
        character: input.character,
        meaning: input.meaning,
        reading: input.reading,
        jlpt_level: input.jlpt_level
      })
      .returning()
      .execute();

    // result is an array with the inserted row
    const kanji = result[0];
    return {
      ...kanji,
      // Ensure created_at is a Date instance (drizzle returns Date for timestamp)
      created_at: new Date(kanji.created_at)
    } as Kanji;
  } catch (error) {
    console.error('Failed to create kanji:', error);
    throw error;
  }
};
