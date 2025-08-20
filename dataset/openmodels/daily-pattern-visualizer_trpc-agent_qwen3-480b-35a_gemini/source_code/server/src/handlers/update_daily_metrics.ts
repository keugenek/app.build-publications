import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { type UpdateDailyMetricsInput, type DailyMetrics } from '../schema';
import { eq } from 'drizzle-orm';

export const updateDailyMetrics = async (input: UpdateDailyMetricsInput): Promise<DailyMetrics> => {
  try {
    // Build the update values object with only provided fields
    const updateValues: any = {};
    
    if (input.date !== undefined) {
      updateValues.date = input.date;
    }
    if (input.sleep_duration !== undefined) {
      updateValues.sleep_duration = input.sleep_duration.toString(); // Convert number to string for numeric column
    }
    if (input.work_hours !== undefined) {
      updateValues.work_hours = input.work_hours.toString(); // Convert number to string for numeric column
    }
    if (input.social_time !== undefined) {
      updateValues.social_time = input.social_time.toString(); // Convert number to string for numeric column
    }
    if (input.screen_time !== undefined) {
      updateValues.screen_time = input.screen_time.toString(); // Convert number to string for numeric column
    }
    if (input.emotional_energy !== undefined) {
      updateValues.emotional_energy = input.emotional_energy; // Integer column - no conversion needed
    }

    // Update the daily metrics record
    const result = await db.update(dailyMetricsTable)
      .set(updateValues)
      .where(eq(dailyMetricsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Daily metrics with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const metrics = result[0];
    return {
      id: metrics.id,
      date: new Date(metrics.date),
      sleep_duration: parseFloat(metrics.sleep_duration),
      work_hours: parseFloat(metrics.work_hours),
      social_time: parseFloat(metrics.social_time),
      screen_time: parseFloat(metrics.screen_time),
      emotional_energy: metrics.emotional_energy,
      created_at: new Date(metrics.created_at)
    };
  } catch (error) {
    console.error('Daily metrics update failed:', error);
    throw error;
  }
};
