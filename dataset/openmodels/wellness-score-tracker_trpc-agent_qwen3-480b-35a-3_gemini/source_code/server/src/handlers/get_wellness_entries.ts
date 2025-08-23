import { type WellnessEntry } from '../schema';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { desc } from 'drizzle-orm';

export const getWellnessEntries = async (): Promise<WellnessEntry[]> => {
  try {
    // Fetch all wellness entries from the database, sorted by date in descending order (newest first)
    const entries = await db.select().from(wellnessEntriesTable).orderBy(desc(wellnessEntriesTable.date));
    
    // Convert string values back to numbers for the return objects
    return entries.map(entry => ({
      ...entry,
      date: new Date(entry.date), // Convert string back to Date
      sleep_hours: parseFloat(entry.sleep_hours),
      wellness_score: parseFloat(entry.wellness_score),
      stress_level: entry.stress_level,
      caffeine_intake: entry.caffeine_intake,
      alcohol_intake: entry.alcohol_intake,
      created_at: entry.created_at,
      updated_at: entry.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch wellness entries:', error);
    throw error;
  }
};
