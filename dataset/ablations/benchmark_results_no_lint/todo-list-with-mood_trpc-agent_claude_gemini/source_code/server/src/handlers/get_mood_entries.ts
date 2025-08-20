import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type MoodEntry } from '../schema';
import { desc } from 'drizzle-orm';

export const getMoodEntries = async (): Promise<MoodEntry[]> => {
  try {
    // Fetch all mood entries ordered by entry date (most recent first)
    const results = await db.select()
      .from(moodEntriesTable)
      .orderBy(desc(moodEntriesTable.entry_date))
      .execute();

    // Return results with proper date conversion
    return results.map(entry => ({
      ...entry,
      entry_date: new Date(entry.entry_date), // Convert date string to Date object
      created_at: new Date(entry.created_at) // Ensure timestamp is Date object
    }));
  } catch (error) {
    console.error('Failed to fetch mood entries:', error);
    throw error;
  }
};
