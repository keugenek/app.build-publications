import { db } from '../db';
import { wellnessEntries } from '../db/schema';
import { desc } from 'drizzle-orm';
import { type WellnessEntry } from '../schema';

/**
 * Fetch all wellness entries ordered by entry_date descending.
 * Numeric fields are converted from string (PostgreSQL numeric) to number.
 */
export const getWellnessEntries = async (): Promise<WellnessEntry[]> => {
  try {
    // Build base query with ordering
    const rows = await db
      .select()
      .from(wellnessEntries)
      .orderBy(desc(wellnessEntries.entry_date))
      .execute();

    // Convert numeric string columns back to numbers for the API response
    return rows.map((row) => ({
      ...row,
      sleep_hours: parseFloat(row.sleep_hours as unknown as string),
      caffeine_intake: parseFloat(row.caffeine_intake as unknown as string),
      alcohol_intake: parseFloat(row.alcohol_intake as unknown as string),
      wellness_score: parseFloat(row.wellness_score as unknown as string)
    }));
  } catch (error) {
    console.error('Failed to fetch wellness entries:', error);
    throw error;
  }
};
