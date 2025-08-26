import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type UpdateMoodEntryInput, type MoodEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMoodEntry = async (input: UpdateMoodEntryInput): Promise<MoodEntry> => {
  try {
    // Prepare the update data - only include fields that are provided
    const updateData: Partial<typeof moodEntriesTable.$inferInsert> = {};
    if (input.mood_level !== undefined) {
      updateData.mood_level = input.mood_level;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update mood entry record
    const result = await db.update(moodEntriesTable)
      .set(updateData)
      .where(eq(moodEntriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Mood entry with id ${input.id} not found`);
    }

    // Return the updated mood entry
    return {
      ...result[0],
      date: new Date(result[0].date) // Convert string date back to Date object
    };
  } catch (error) {
    console.error('Mood entry update failed:', error);
    throw error;
  }
};
