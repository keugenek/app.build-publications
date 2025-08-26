import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput, type WellnessTrend } from '../schema';
import { eq, and, gte, lte, asc, SQL } from 'drizzle-orm';

export async function getWellnessTrends(input: GetWellnessEntriesInput): Promise<WellnessTrend[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by user_id
    conditions.push(eq(wellnessEntriesTable.user_id, input.user_id));

    // Add date range filters if provided
    if (input.start_date) {
      conditions.push(gte(wellnessEntriesTable.date, input.start_date.toISOString().split('T')[0]));
    }

    if (input.end_date) {
      conditions.push(lte(wellnessEntriesTable.date, input.end_date.toISOString().split('T')[0]));
    }

    // Execute the query with all conditions and modifiers
    const results = await db.select({
      date: wellnessEntriesTable.date,
      sleep_hours: wellnessEntriesTable.sleep_hours,
      stress_level: wellnessEntriesTable.stress_level,
      caffeine_intake: wellnessEntriesTable.caffeine_intake,
      alcohol_intake: wellnessEntriesTable.alcohol_intake,
      wellness_score: wellnessEntriesTable.wellness_score
    })
    .from(wellnessEntriesTable)
    .where(and(...conditions))
    .orderBy(asc(wellnessEntriesTable.date))
    .limit(input.limit)
    .execute();

    // Convert numeric fields back to numbers and ensure proper date handling
    return results.map(result => ({
      date: new Date(result.date),
      sleep_hours: parseFloat(result.sleep_hours),
      stress_level: result.stress_level, // Integer column - no conversion needed
      caffeine_intake: parseFloat(result.caffeine_intake),
      alcohol_intake: parseFloat(result.alcohol_intake),
      wellness_score: parseFloat(result.wellness_score)
    }));
  } catch (error) {
    console.error('Get wellness trends failed:', error);
    throw error;
  }
}
