import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type CreateMoodEntryInput, type MoodEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const createMoodEntry = async (input: CreateMoodEntryInput): Promise<MoodEntry> => {
  try {
    // Check if mood entry already exists for the given date
    const existingEntry = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.date, input.date))
      .execute();

    if (existingEntry.length > 0) {
      // Update existing entry (only one mood entry per day allowed)
      const updateResult = await db.update(moodEntriesTable)
        .set({
          mood_score: input.mood_score,
          note: input.note || null,
          updated_at: new Date()
        })
        .where(eq(moodEntriesTable.id, existingEntry[0].id))
        .returning()
        .execute();

      // Convert date string to Date object for return type
      const result = updateResult[0];
      return {
        ...result,
        date: new Date(result.date)
      };
    } else {
      // Create new mood entry
      const insertResult = await db.insert(moodEntriesTable)
        .values({
          date: input.date,
          mood_score: input.mood_score,
          note: input.note || null
        })
        .returning()
        .execute();

      // Convert date string to Date object for return type
      const result = insertResult[0];
      return {
        ...result,
        date: new Date(result.date)
      };
    }
  } catch (error) {
    console.error('Mood entry creation failed:', error);
    throw error;
  }
};
