import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type DailyLog } from '../schema';

export const getDailyLogs = async (): Promise<DailyLog[]> => {
  try {
    const results = await db.select()
      .from(dailyLogsTable)
      .orderBy(dailyLogsTable.date)
      .execute();

    // Convert numeric fields back to numbers and date to Date object before returning
    return results.map(log => ({
      ...log,
      date: new Date(log.date),
      sleep_hours: parseFloat(log.sleep_hours),
      work_hours: parseFloat(log.work_hours),
      social_time: parseFloat(log.social_time),
      screen_time: parseFloat(log.screen_time),
      emotional_energy: parseFloat(log.emotional_energy)
    }));
  } catch (error) {
    console.error('Failed to fetch daily logs:', error);
    throw error;
  }
};
