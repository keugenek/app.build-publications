import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type UpdateKanjiInput, type Kanji } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateKanji(input: UpdateKanjiInput): Promise<Kanji | null> {
  try {
    // Check if kanji exists first
    const existingKanji = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, input.id))
      .execute();

    if (existingKanji.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    
    if (input.character !== undefined) updateData['character'] = input.character;
    if (input.meaning !== undefined) updateData['meaning'] = input.meaning;
    if (input.kun_reading !== undefined) updateData['kun_reading'] = input.kun_reading;
    if (input.on_reading !== undefined) updateData['on_reading'] = input.on_reading;
    if (input.romaji !== undefined) updateData['romaji'] = input.romaji;
    if (input.jlpt_level !== undefined) updateData['jlpt_level'] = input.jlpt_level;

    // If no fields to update, return existing kanji
    if (Object.keys(updateData).length === 0) {
      return existingKanji[0];
    }

    // Perform update
    const result = await db.update(kanjiTable)
      .set(updateData)
      .where(eq(kanjiTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Kanji update failed:', error);
    throw error;
  }
}

export async function deleteKanji(id: number): Promise<boolean> {
  try {
    // Delete kanji - foreign key cascade will handle user progress deletion
    const result = await db.delete(kanjiTable)
      .where(eq(kanjiTable.id, id))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Kanji deletion failed:', error);
    throw error;
  }
}
