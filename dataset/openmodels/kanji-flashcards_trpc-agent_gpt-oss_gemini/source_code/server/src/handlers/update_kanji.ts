import { type UpdateKanjiInput, type Kanji } from '../schema';
import { db } from '../db';
import { kanjis, type NewKanji } from '../db/schema';
import { eq } from 'drizzle-orm';

export const updateKanji = async (input: UpdateKanjiInput): Promise<Kanji> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<NewKanji> = {};
    if (input.character !== undefined) updateData.character = input.character;
    if (input.meaning !== undefined) updateData.meaning = input.meaning;
    if (input.reading !== undefined) updateData.reading = input.reading;
    if (input.jlpt_level !== undefined) updateData.jlpt_level = input.jlpt_level;

    const result = await db
      .update(kanjis)
      .set(updateData)
      .where(eq(kanjis.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Kanji with id ${input.id} not found`);
    }

    const updated = result[0];
    // Ensure created_at is a Date instance
    return {
      ...updated,
      created_at: new Date(updated.created_at)
    } as Kanji;
  } catch (error) {
    console.error('Kanji update failed:', error);
    throw error;
  }
};
