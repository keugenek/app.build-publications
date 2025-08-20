import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput, type WellnessEntry } from '../schema';
import { eq, gte, lte, and, desc, type SQL } from 'drizzle-orm';

export async function getWellnessEntries(input: GetWellnessEntriesInput): Promise<WellnessEntry[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Always filter by user_id
    conditions.push(eq(wellnessEntriesTable.user_id, input.user_id));

    // Add start_date filter if provided
    if (input.start_date) {
      conditions.push(gte(wellnessEntriesTable.date, input.start_date.toISOString().split('T')[0]));
    }

    // Add end_date filter if provided
    if (input.end_date) {
      conditions.push(lte(wellnessEntriesTable.date, input.end_date.toISOString().split('T')[0]));
    }

    // Build and execute the query in one chain
    const results = await db.select()
      .from(wellnessEntriesTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(wellnessEntriesTable.date))
      .limit(input.limit)
      .execute();

    // Convert numeric fields and date back to proper types before returning
    return results.map(entry => ({
      ...entry,
      date: new Date(entry.date), // Convert string date to Date object
      sleep_hours: parseFloat(entry.sleep_hours),
      caffeine_intake: parseFloat(entry.caffeine_intake),
      alcohol_intake: parseFloat(entry.alcohol_intake),
      wellness_score: parseFloat(entry.wellness_score)
    }));
  } catch (error) {
    console.error('Get wellness entries failed:', error);
    throw error;
  }
}
