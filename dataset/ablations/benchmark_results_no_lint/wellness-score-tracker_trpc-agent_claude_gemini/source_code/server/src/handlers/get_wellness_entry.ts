import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntryInput, type WellnessEntry } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getWellnessEntry(input: GetWellnessEntryInput): Promise<WellnessEntry | null> {
  try {
    // Query for a specific wellness entry by ID and user_id to ensure user can only access their own entries
    const results = await db.select()
      .from(wellnessEntriesTable)
      .where(and(
        eq(wellnessEntriesTable.id, input.id),
        eq(wellnessEntriesTable.user_id, input.user_id)
      ))
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    const entry = results[0];

    // Convert numeric fields back to numbers and date to Date object for the return type
    return {
      ...entry,
      sleep_hours: parseFloat(entry.sleep_hours), // Convert string to number
      wellness_score: parseFloat(entry.wellness_score), // Convert string to number
      date: new Date(entry.date), // Convert date string to Date object
      created_at: entry.created_at // Timestamp fields are already Date objects
    };
  } catch (error) {
    console.error('Failed to fetch wellness entry:', error);
    throw error;
  }
}
