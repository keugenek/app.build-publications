import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput, type WellnessEntry } from '../schema';
import { eq, and, gte, lte, desc, type SQL } from 'drizzle-orm';

export async function getWellnessEntries(input: GetWellnessEntriesInput): Promise<WellnessEntry[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Always filter by user_id
    conditions.push(eq(wellnessEntriesTable.user_id, input.user_id));

    // Add date range filters if provided
    if (input.start_date) {
      conditions.push(gte(wellnessEntriesTable.date, input.start_date));
    }

    if (input.end_date) {
      conditions.push(lte(wellnessEntriesTable.date, input.end_date));
    }

    // Build query step by step
    const results = await db.select()
      .from(wellnessEntriesTable)
      .where(and(...conditions))
      .orderBy(desc(wellnessEntriesTable.date))
      .limit(input.limit)
      .execute();

    // Convert string fields to proper types
    return results.map(entry => ({
      ...entry,
      date: new Date(entry.date), // Convert date string to Date object
      sleep_hours: parseFloat(entry.sleep_hours), // Convert numeric string to number
      wellness_score: parseFloat(entry.wellness_score) // Convert numeric string to number
    }));
  } catch (error) {
    console.error('Failed to fetch wellness entries:', error);
    throw error;
  }
}
