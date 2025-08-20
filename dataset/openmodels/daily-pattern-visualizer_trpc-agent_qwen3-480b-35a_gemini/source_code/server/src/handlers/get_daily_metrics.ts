import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { type DailyMetrics } from '../schema';

export const getDailyMetrics = async (): Promise<DailyMetrics[]> => {
  try {
    // Fetch all daily metrics from the database
    const results = await db.select()
      .from(dailyMetricsTable)
      .execute();

    // Convert numeric fields back to numbers and date strings to Date objects
    return results.map(metric => ({
      ...metric,
      date: new Date(metric.date),
      sleep_duration: parseFloat(metric.sleep_duration),
      work_hours: parseFloat(metric.work_hours),
      social_time: parseFloat(metric.social_time),
      screen_time: parseFloat(metric.screen_time)
    }));
  } catch (error) {
    console.error('Failed to fetch daily metrics:', error);
    throw error;
  }
};
