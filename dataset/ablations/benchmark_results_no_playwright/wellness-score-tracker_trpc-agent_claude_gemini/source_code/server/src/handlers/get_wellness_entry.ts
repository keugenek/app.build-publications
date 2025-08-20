import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntryInput, type WellnessEntry } from '../schema';
import { eq, and } from 'drizzle-orm';

/**
 * Retrieves a single wellness entry by ID for a specific user.
 * Ensures users can only access their own wellness data.
 */
export async function getWellnessEntry(input: GetWellnessEntryInput): Promise<WellnessEntry | null> {
  try {
    // Query the wellness entry with both ID and user_id filters for security
    const results = await db.select()
      .from(wellnessEntriesTable)
      .where(and(
        eq(wellnessEntriesTable.id, input.id),
        eq(wellnessEntriesTable.user_id, input.user_id)
      ))
      .execute();

    // Return null if no entry found or doesn't belong to the user
    if (results.length === 0) {
      return null;
    }

    const entry = results[0];

    // Convert numeric fields from strings to numbers (real/numeric columns)
    // Convert date string to Date object to match schema expectation
    return {
      ...entry,
      date: new Date(entry.date),
      hours_of_sleep: parseFloat(entry.hours_of_sleep.toString()),
      caffeine_intake: parseFloat(entry.caffeine_intake.toString()),
      alcohol_intake: parseFloat(entry.alcohol_intake.toString()),
      wellness_score: parseFloat(entry.wellness_score.toString())
    };
  } catch (error) {
    console.error('Get wellness entry failed:', error);
    throw error;
  }
}
