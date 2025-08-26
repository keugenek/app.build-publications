import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { type CreateDailyMetricsInput, type DailyMetrics } from '../schema';

export const createDailyMetrics = async (input: CreateDailyMetricsInput): Promise<DailyMetrics> => {
  try {
    // Insert daily metrics record
    const result = await db.insert(dailyMetricsTable)
      .values({
        date: input.date.toISOString().split('T')[0], // Convert Date to string format for date column
        sleep_duration: input.sleep_duration.toString(), // Convert number to string for numeric column
        work_hours: input.work_hours.toString(), // Convert number to string for numeric column
        social_time: input.social_time.toString(), // Convert number to string for numeric column
        screen_time: input.screen_time.toString(), // Convert number to string for numeric column
        emotional_energy: input.emotional_energy // Integer column - no conversion needed
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const metrics = result[0];
    return {
      ...metrics,
      date: new Date(metrics.date), // Convert string back to Date
      sleep_duration: parseFloat(metrics.sleep_duration),
      work_hours: parseFloat(metrics.work_hours),
      social_time: parseFloat(metrics.social_time),
      screen_time: parseFloat(metrics.screen_time)
    };
  } catch (error) {
    console.error('Daily metrics creation failed:', error);
    throw error;
  }
};
