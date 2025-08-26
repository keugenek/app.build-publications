import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { type CreateDailyMetricsInput, type DailyMetrics } from '../schema';

export const createDailyMetrics = async (input: CreateDailyMetricsInput): Promise<DailyMetrics> => {
  try {
    // Insert daily metrics record
    const result = await db.insert(dailyMetricsTable)
      .values({
        date: input.date,
        sleep_duration: input.sleep_duration,
        work_hours: input.work_hours,
        social_interaction_time: input.social_interaction_time,
        screen_time: input.screen_time,
        emotional_energy_level: input.emotional_energy_level,
        notes: input.notes || null
      })
      .returning()
      .execute();

    const metrics = result[0];
    return {
      ...metrics,
      date: new Date(metrics.date + 'T00:00:00Z'), // Convert date string to Date object
      created_at: new Date(metrics.created_at),
      updated_at: new Date(metrics.updated_at)
    };
  } catch (error) {
    console.error('Daily metrics creation failed:', error);
    throw error;
  }
};
