import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type CreateMoodEntryInput, type MoodEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const createMoodEntry = async (input: CreateMoodEntryInput): Promise<MoodEntry> => {
  try {
    // Check if an entry already exists for the given date
    const existingEntry = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.entry_date, input.entry_date))
      .execute();

    if (existingEntry.length > 0) {
      // Update the existing entry
      const result = await db.update(moodEntriesTable)
        .set({
          mood_score: input.mood_score,
          notes: input.notes || null
        })
        .where(eq(moodEntriesTable.entry_date, input.entry_date))
        .returning()
        .execute();

      // Convert the entry_date string to Date object for the return type
      const dbEntry = result[0];
      return {
        ...dbEntry,
        entry_date: new Date(dbEntry.entry_date + 'T00:00:00.000Z') // Convert date string to Date object
      };
    } else {
      // Create a new entry
      const result = await db.insert(moodEntriesTable)
        .values({
          mood_score: input.mood_score,
          notes: input.notes || null,
          entry_date: input.entry_date
        })
        .returning()
        .execute();

      // Convert the entry_date string to Date object for the return type
      const dbEntry = result[0];
      return {
        ...dbEntry,
        entry_date: new Date(dbEntry.entry_date + 'T00:00:00.000Z') // Convert date string to Date object
      };
    }
  } catch (error) {
    console.error('Mood entry creation/update failed:', error);
    throw error;
  }
};
