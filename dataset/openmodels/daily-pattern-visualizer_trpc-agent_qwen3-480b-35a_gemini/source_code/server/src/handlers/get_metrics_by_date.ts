import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { type DailyMetrics } from '../schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const getMetricsByDate = async (date: Date): Promise<DailyMetrics | null> => {
  try {
    // Format date as YYYY-MM-DD string for database query
    const formattedDate = date.toISOString().split('T')[0];
    
    // Query the database for metrics on the specified date
    const result = await db.select()
      .from(dailyMetricsTable)
      .where(eq(dailyMetricsTable.date, formattedDate))
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const metrics = result[0];
    return {
      ...metrics,
      date: new Date(metrics.date), // Convert string back to Date
      sleep_duration: parseFloat(metrics.sleep_duration),
      work_hours: parseFloat(metrics.work_hours),
      social_time: parseFloat(metrics.social_time),
      screen_time: parseFloat(metrics.screen_time),
      emotional_energy: metrics.emotional_energy,
      created_at: metrics.created_at
    };
  } catch (error) {
    console.error('Failed to fetch metrics by date:', error);
    throw error;
  }
};
