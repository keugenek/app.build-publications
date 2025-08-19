import { db } from '../db';
import { dailyConspiracyLevelsTable } from '../db/schema';
import { type GetConspiracyLevelsByDateRangeInput, type DailyConspiracyLevel } from '../schema';
import { gte, lte, desc, and } from 'drizzle-orm';

export async function getConspiracyLevelsByDateRange(input: GetConspiracyLevelsByDateRangeInput): Promise<DailyConspiracyLevel[]> {
  try {
    // Apply date range filters and order by date descending (newest first)
    const results = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(and(
        gte(dailyConspiracyLevelsTable.date, input.start_date.toISOString().split('T')[0]), // Convert to YYYY-MM-DD format
        lte(dailyConspiracyLevelsTable.date, input.end_date.toISOString().split('T')[0])
      ))
      .orderBy(desc(dailyConspiracyLevelsTable.date))
      .execute();

    // Return results with proper date conversion
    return results.map(result => ({
      ...result,
      date: new Date(result.date), // Convert date string to Date object
      created_at: result.created_at,
      updated_at: result.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch conspiracy levels by date range:', error);
    throw error;
  }
}
