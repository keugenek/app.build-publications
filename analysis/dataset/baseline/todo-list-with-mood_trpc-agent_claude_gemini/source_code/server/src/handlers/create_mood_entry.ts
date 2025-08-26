import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type CreateMoodEntryInput, type MoodEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const createMoodEntry = async (input: CreateMoodEntryInput): Promise<MoodEntry> => {
  try {
    // Set date to today if not provided
    const entryDate = input.date ? input.date : new Date().toISOString().split('T')[0];
    
    // Check if an entry already exists for this date
    const existingEntry = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.date, entryDate))
      .execute();

    if (existingEntry.length > 0) {
      // Update existing entry
      const result = await db.update(moodEntriesTable)
        .set({
          mood_rating: input.mood_rating,
          note: input.note,
        })
        .where(eq(moodEntriesTable.date, entryDate))
        .returning()
        .execute();

      const entry = result[0];
      return {
        ...entry,
        date: new Date(entry.date)
      };
    } else {
      // Create new entry
      const result = await db.insert(moodEntriesTable)
        .values({
          mood_rating: input.mood_rating,
          note: input.note,
          date: entryDate,
        })
        .returning()
        .execute();

      const entry = result[0];
      return {
        ...entry,
        date: new Date(entry.date)
      };
    }
  } catch (error) {
    console.error('Mood entry creation failed:', error);
    throw error;
  }
};
