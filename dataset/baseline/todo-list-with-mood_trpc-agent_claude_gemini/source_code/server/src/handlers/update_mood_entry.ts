import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type UpdateMoodEntryInput, type MoodEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMoodEntry = async (input: UpdateMoodEntryInput): Promise<MoodEntry> => {
  try {
    // First, check if the mood entry exists
    const existingEntry = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, input.id))
      .execute();

    if (existingEntry.length === 0) {
      throw new Error(`Mood entry with ID ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof moodEntriesTable.$inferInsert> = {};
    
    if (input.mood_rating !== undefined) {
      updateData.mood_rating = input.mood_rating;
    }
    
    if (input.note !== undefined) {
      updateData.note = input.note;
    }

    // If no fields to update, return the existing entry
    if (Object.keys(updateData).length === 0) {
      const existing = existingEntry[0];
      return {
        ...existing,
        date: new Date(existing.date), // Convert string to Date for schema compatibility
      };
    }

    // Update the mood entry
    const result = await db.update(moodEntriesTable)
      .set(updateData)
      .where(eq(moodEntriesTable.id, input.id))
      .returning()
      .execute();

    const updated = result[0];
    return {
      ...updated,
      date: new Date(updated.date), // Convert string to Date for schema compatibility
    };
  } catch (error) {
    console.error('Mood entry update failed:', error);
    throw error;
  }
};
