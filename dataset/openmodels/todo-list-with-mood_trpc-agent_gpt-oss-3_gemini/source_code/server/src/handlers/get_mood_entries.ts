import { type MoodEntry } from '../schema';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';

/**
 * Placeholder handler for fetching all mood entries.
 */
export const getMoodEntries = async (): Promise<MoodEntry[]> => {
  try {
    const results = await db.select()
      .from(moodEntriesTable)
      .execute();
    // Drizzle returns Date objects for date and timestamp columns, no numeric conversion needed
    const entries = results.map(r => ({
        ...r,
        // Convert date string to Date object if needed
        date: typeof r.date === 'string' ? new Date(r.date) : r.date,
      } as MoodEntry));
    return entries;
  } catch (error) {
    console.error('Failed to fetch mood entries:', error);
    throw error;
  }
};
