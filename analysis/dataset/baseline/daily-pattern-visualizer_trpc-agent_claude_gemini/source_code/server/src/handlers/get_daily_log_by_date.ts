import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetLogByDateInput, type DailyLog } from '../schema';

export async function getDailyLogByDate(input: GetLogByDateInput): Promise<DailyLog | null> {
  try {
    // Query for daily log by date
    const results = await db.select()
      .from(dailyLogsTable)
      .where(eq(dailyLogsTable.date, input.date))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const log = results[0];
    
    // Convert numeric fields back to numbers and date string to Date object
    return {
      ...log,
      date: new Date(log.date),
      sleep_duration: parseFloat(log.sleep_duration.toString()),
      work_hours: parseFloat(log.work_hours.toString()),
      social_time: parseFloat(log.social_time.toString()),
      screen_time: parseFloat(log.screen_time.toString())
    };
  } catch (error) {
    console.error('Failed to fetch daily log by date:', error);
    throw error;
  }
}
