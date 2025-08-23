import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type WellnessEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const getWellnessEntry = async (id: number): Promise<WellnessEntry | null> => {
  try {
    // Query the database for a wellness entry with the specified ID
    const result = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, id))
      .limit(1)
      .execute();

    // If no entry found, return null
    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields from strings back to numbers
    const entry = result[0];
    return {
      id: entry.id,
      date: new Date(entry.date), // Convert string to Date
      sleep_hours: parseFloat(entry.sleep_hours),
      stress_level: entry.stress_level,
      caffeine_intake: parseFloat(entry.caffeine_intake),
      alcohol_intake: parseFloat(entry.alcohol_intake),
      wellness_score: parseFloat(entry.wellness_score),
      created_at: entry.created_at,
      updated_at: entry.updated_at
    };
  } catch (error) {
    console.error('Failed to fetch wellness entry:', error);
    throw error;
  }
};
