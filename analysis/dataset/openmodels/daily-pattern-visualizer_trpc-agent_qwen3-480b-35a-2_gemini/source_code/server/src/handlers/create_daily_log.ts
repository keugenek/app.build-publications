import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type CreateDailyLogInput, type DailyLog } from '../schema';

export const createDailyLog = async (input: CreateDailyLogInput): Promise<DailyLog> => {
  try {
    // Insert daily log record with proper numeric conversions
    const result = await db.insert(dailyLogsTable)
      .values({
        date: input.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string for date column
        sleep_hours: input.sleep_hours.toString(), // Convert number to string for numeric column
        work_hours: input.work_hours.toString(), // Convert number to string for numeric column
        social_time: input.social_time.toString(), // Convert number to string for numeric column
        screen_time: input.screen_time.toString(), // Convert number to string for numeric column
        emotional_energy: input.emotional_energy.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const log = result[0];
    return {
      ...log,
      date: new Date(log.date), // Convert string back to date
      sleep_hours: parseFloat(log.sleep_hours), // Convert string back to number
      work_hours: parseFloat(log.work_hours), // Convert string back to number
      social_time: parseFloat(log.social_time), // Convert string back to number
      screen_time: parseFloat(log.screen_time), // Convert string back to number
      emotional_energy: parseFloat(log.emotional_energy), // Convert string back to number
      created_at: log.created_at // Already a Date object
    };
  } catch (error) {
    console.error('Daily log creation failed:', error);
    throw error;
  }
};
