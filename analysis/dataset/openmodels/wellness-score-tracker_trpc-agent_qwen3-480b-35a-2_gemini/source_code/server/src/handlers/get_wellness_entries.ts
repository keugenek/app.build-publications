import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type WellnessEntry } from '../schema';

export const getWellnessEntries = async (): Promise<WellnessEntry[]> => {
  try {
    // Fetch all wellness entries from the database
    const results = await db.select()
      .from(wellnessEntriesTable)
      .orderBy(wellnessEntriesTable.date)
      .execute();

    // Convert numeric fields back to numbers and date strings to Date objects before returning
    return results.map(entry => ({
      ...entry,
      date: new Date(entry.date),
      sleep_hours: parseFloat(entry.sleep_hours),
      caffeine_intake: parseFloat(entry.caffeine_intake),
      alcohol_intake: parseFloat(entry.alcohol_intake),
      wellness_score: parseFloat(entry.wellness_score)
    }));
  } catch (error) {
    console.error('Failed to fetch wellness entries:', error);
    throw error;
  }
};
