import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { type GetMetricsByDateInput, type DailyMetrics } from '../schema';
import { eq } from 'drizzle-orm';

export const getDailyMetricsByDate = async (input: GetMetricsByDateInput): Promise<DailyMetrics | null> => {
  try {
    // Query for metrics by specific date
    const result = await db.select()
      .from(dailyMetricsTable)
      .where(eq(dailyMetricsTable.date, input.date))
      .execute();

    // Return null if no metrics found for the date
    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields from strings to numbers and return the first (and only) result
    const metrics = result[0];
    return {
      ...metrics,
      date: new Date(metrics.date), // Convert date string to Date object
      sleep_duration: parseFloat(metrics.sleep_duration.toString()),
      work_hours: parseFloat(metrics.work_hours.toString()),
      social_interaction_time: parseFloat(metrics.social_interaction_time.toString()),
      screen_time: parseFloat(metrics.screen_time.toString())
    };
  } catch (error) {
    console.error('Failed to get daily metrics by date:', error);
    throw error;
  }
};
