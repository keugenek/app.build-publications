import { db } from '../db';
import { dailyEntriesTable } from '../db/schema';
import { type CreateDailyEntryInput, type DailyEntry } from '../schema';

export const createDailyEntry = async (input: CreateDailyEntryInput): Promise<DailyEntry> => {
  try {
    // Insert daily entry record
    const result = await db.insert(dailyEntriesTable)
      .values({
        date: input.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string for date column
        mood: input.mood,
        notes: input.notes,
        updated_at: new Date()
      })
      .returning()
      .execute();

    const dailyEntry = result[0];
    return {
      ...dailyEntry,
      date: new Date(dailyEntry.date), // Convert date string back to Date object
      created_at: dailyEntry.created_at!,
      updated_at: dailyEntry.updated_at!
    };
  } catch (error) {
    console.error('Daily entry creation failed:', error);
    throw error;
  }
};
