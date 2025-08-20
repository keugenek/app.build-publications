import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntriesInput, type WellnessTrend } from '../schema';
import { eq, and, gte, lte, asc, SQL } from 'drizzle-orm';

/**
 * Retrieves wellness trend data for historical analysis and visualization.
 * Returns simplified data points optimized for charting and trend analysis.
 */
export async function getWellnessTrends(input: GetWellnessEntriesInput): Promise<WellnessTrend[]> {
  try {
    // Build conditions array
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

    // Start building the query
    const baseQuery = db.select()
      .from(wellnessEntriesTable)
      .where(and(...conditions))
      .orderBy(asc(wellnessEntriesTable.date));

    // Apply limit if provided
    const finalQuery = input.limit ? baseQuery.limit(input.limit) : baseQuery;

    const results = await finalQuery.execute();

    // Transform data into trend format with proper numeric conversions  
    return results.map(entry => ({
      date: new Date(entry.date),
      wellness_score: Number(entry.wellness_score),
      hours_of_sleep: Number(entry.hours_of_sleep),
      stress_level: entry.stress_level, // Integer column - no conversion needed
      caffeine_intake: Number(entry.caffeine_intake),
      alcohol_intake: Number(entry.alcohol_intake)
    }));
  } catch (error) {
    console.error('Get wellness trends failed:', error);
    throw error;
  }
}
