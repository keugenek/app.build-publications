import { type CreateDailyMetricsInput, type DailyMetrics } from '../schema';
import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';

/**
 * Placeholder handler for creating a daily metrics entry.
 * In a real implementation this would insert the record into the database.
 */
export async function createDailyMetrics(input: CreateDailyMetricsInput): Promise<DailyMetrics> {
  try {
    // Insert daily metrics record. Numeric columns must be stored as strings.
    const result = await db.insert(dailyMetricsTable)
      .values({
        date: input.date.toISOString().split('T')[0],
        sleep_duration: input.sleep_duration.toString(),
        work_hours: input.work_hours.toString(),
        social_time: input.social_time.toString(),
        screen_time: input.screen_time.toString(),
        emotional_energy: input.emotional_energy,
      })
      .returning()
      .execute();

    const row = result[0];
    // Convert numeric columns back to numbers for the return type
    return {
      id: row.id,
      date: new Date(row.date),
      sleep_duration: parseFloat(row.sleep_duration),
      work_hours: parseFloat(row.work_hours),
      social_time: parseFloat(row.social_time),
      screen_time: parseFloat(row.screen_time),
      emotional_energy: row.emotional_energy,
    } as DailyMetrics;
  } catch (error) {
    console.error('Failed to create daily metrics:', error);
    throw error;
  }
}
