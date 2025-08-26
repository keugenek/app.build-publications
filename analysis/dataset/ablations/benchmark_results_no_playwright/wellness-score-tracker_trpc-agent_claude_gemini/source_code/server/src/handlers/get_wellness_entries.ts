import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput, type WellnessEntry } from '../schema';
import { eq, gte, lte, and, desc, type SQL } from 'drizzle-orm';

/**
 * Retrieves wellness entries for a user within an optional date range.
 * Results are ordered by date descending (newest first) for trend analysis.
 */
export async function getWellnessEntries(input: GetWellnessEntriesInput): Promise<WellnessEntry[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by user_id
    conditions.push(eq(wellnessEntriesTable.user_id, input.user_id));

    // Apply date range filters if provided
    if (input.start_date !== undefined) {
      conditions.push(gte(wellnessEntriesTable.date, input.start_date.toISOString().split('T')[0]));
    }

    if (input.end_date !== undefined) {
      conditions.push(lte(wellnessEntriesTable.date, input.end_date.toISOString().split('T')[0]));
    }

    // Apply limit (default to 30 if not specified)
    const limit = input.limit ?? 30;

    // Build and execute query
    const results = await db.select()
      .from(wellnessEntriesTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(wellnessEntriesTable.date))
      .limit(limit)
      .execute();

    // Convert numeric fields and dates properly
    return results.map(entry => ({
      ...entry,
      hours_of_sleep: typeof entry.hours_of_sleep === 'string' ? parseFloat(entry.hours_of_sleep) : entry.hours_of_sleep,
      caffeine_intake: typeof entry.caffeine_intake === 'string' ? parseFloat(entry.caffeine_intake) : entry.caffeine_intake,
      alcohol_intake: typeof entry.alcohol_intake === 'string' ? parseFloat(entry.alcohol_intake) : entry.alcohol_intake,
      wellness_score: typeof entry.wellness_score === 'string' ? parseFloat(entry.wellness_score) : entry.wellness_score,
      date: new Date(entry.date),
      created_at: new Date(entry.created_at),
      updated_at: new Date(entry.updated_at)
    }));
  } catch (error) {
    console.error('Failed to get wellness entries:', error);
    throw error;
  }
}
