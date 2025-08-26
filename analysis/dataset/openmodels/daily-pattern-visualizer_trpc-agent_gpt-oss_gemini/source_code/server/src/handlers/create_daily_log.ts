import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type CreateDailyLogInput, type DailyLog } from '../schema';

export const createDailyLog = async (input: CreateDailyLogInput): Promise<DailyLog> => {
  try {
    const result = await db
      .insert(dailyLogsTable)
      .values({
        logged_at: input.logged_at,
        sleep_hours: input.sleep_hours,
        work_hours: input.work_hours,
        social_hours: input.social_hours,
        screen_hours: input.screen_hours,
        emotional_energy: input.emotional_energy,
      })
      .returning()
      .execute();

    // The DB returns the inserted row(s). Return the first one.
    const dailyLog = result[0];
    return dailyLog as DailyLog;
  } catch (error) {
    console.error('Failed to create daily log:', error);
    throw error;
  }
};
