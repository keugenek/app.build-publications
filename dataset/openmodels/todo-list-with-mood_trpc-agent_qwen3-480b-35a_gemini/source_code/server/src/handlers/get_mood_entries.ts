import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type MoodEntry } from '../schema';

export const getMoodEntries = async (): Promise<MoodEntry[]> => {
  try {
    const results = await db.select()
      .from(moodEntriesTable)
      .orderBy(moodEntriesTable.date)
      .execute();

    // Map the results to match the Zod schema type
    return results.map(entry => ({
      ...entry,
      date: new Date(entry.date), // Convert date string to Date object
      created_at: new Date(entry.created_at) // Convert timestamp string to Date object
    }));
  } catch (error) {
    console.error('Failed to fetch mood entries:', error);
    throw error;
  }
};
