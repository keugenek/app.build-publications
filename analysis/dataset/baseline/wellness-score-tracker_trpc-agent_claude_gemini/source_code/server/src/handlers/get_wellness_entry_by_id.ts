import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type WellnessEntry } from '../schema';
import { eq } from 'drizzle-orm';

export async function getWellnessEntryById(id: number): Promise<WellnessEntry | null> {
  try {
    // Query the database for the wellness entry by ID
    const results = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, id))
      .execute();

    // Return null if no entry found
    if (results.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers and date string to Date for the API response
    const entry = results[0];
    return {
      ...entry,
      sleep_hours: parseFloat(entry.sleep_hours),
      caffeine_intake: parseFloat(entry.caffeine_intake),
      alcohol_intake: parseFloat(entry.alcohol_intake),
      wellness_score: parseFloat(entry.wellness_score),
      entry_date: new Date(entry.entry_date)
    };
  } catch (error) {
    console.error('Failed to get wellness entry by ID:', error);
    throw error;
  }
}
