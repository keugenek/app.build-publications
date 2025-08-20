import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type UpdateMoodEntryInput, type MoodEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMoodEntry = async (input: UpdateMoodEntryInput): Promise<MoodEntry> => {
  try {
    // Prepare update values - only include fields that were provided
    const updateValues: any = {
      updated_at: new Date()
    };

    if (input.mood_score !== undefined) {
      updateValues.mood_score = input.mood_score;
    }

    if (input.note !== undefined) {
      updateValues.note = input.note;
    }

    // Update mood entry record
    const result = await db.update(moodEntriesTable)
      .set(updateValues)
      .where(eq(moodEntriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Mood entry with id ${input.id} not found`);
    }

    // Convert date string to Date object to match schema
    const moodEntry = result[0];
    return {
      ...moodEntry,
      date: new Date(moodEntry.date)
    };
  } catch (error) {
    console.error('Mood entry update failed:', error);
    throw error;
  }
};
