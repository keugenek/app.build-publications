import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { type GetMetricsByDateRangeInput, type DailyMetrics } from '../schema';
import { and, gte, lte, asc } from 'drizzle-orm';

export const getMetricsByDateRange = async (input: GetMetricsByDateRangeInput): Promise<DailyMetrics[]> => {
  try {
    // Parse date strings to Date objects for database query
    const startDate = new Date(input.start_date);
    const endDate = new Date(input.end_date);

    // Query daily metrics within the date range (inclusive)
    const results = await db.select()
      .from(dailyMetricsTable)
      .where(and(
        gte(dailyMetricsTable.date, input.start_date), // Use the string dates directly
        lte(dailyMetricsTable.date, input.end_date)    // Use the string dates directly
      ))
      .orderBy(asc(dailyMetricsTable.date))
      .execute();

    // Convert date string to Date object for schema compliance
    return results.map(result => ({
      ...result,
      date: new Date(result.date), // Convert date string to Date object
      created_at: result.created_at,
      updated_at: result.updated_at
    }));
  } catch (error) {
    console.error('Get metrics by date range failed:', error);
    throw error;
  }
};
