import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntryInput, type WellnessEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const getWellnessEntry = async (input: GetWellnessEntryInput): Promise<WellnessEntry | null> => {
  try {
    // Query wellness entry by ID
    const result = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, input.id))
      .execute();

    // Return null if entry not found
    if (result.length === 0) {
      return null;
    }

    const entry = result[0];

    // Convert numeric fields back to numbers and date to Date object
    return {
      ...entry,
      date: new Date(entry.date),
      sleep_hours: parseFloat(entry.sleep_hours),
      caffeine_intake: parseFloat(entry.caffeine_intake),
      alcohol_intake: parseFloat(entry.alcohol_intake),
      wellness_score: parseFloat(entry.wellness_score)
    };
  } catch (error) {
    console.error('Wellness entry retrieval failed:', error);
    throw error;
  }
};
