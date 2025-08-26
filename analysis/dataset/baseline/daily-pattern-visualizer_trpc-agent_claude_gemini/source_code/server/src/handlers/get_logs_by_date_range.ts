import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type GetLogsByDateRangeInput, type DailyLog } from '../schema';
import { and, gte, lte, asc } from 'drizzle-orm';

export const getLogsByDateRange = async (input: GetLogsByDateRangeInput): Promise<DailyLog[]> => {
  try {
    // Query logs within the date range, ordered by date ascending
    const results = await db.select()
      .from(dailyLogsTable)
      .where(and(
        gte(dailyLogsTable.date, input.start_date),
        lte(dailyLogsTable.date, input.end_date)
      ))
      .orderBy(asc(dailyLogsTable.date))
      .execute();

    // Convert real fields back to numbers and ensure proper date types
    return results.map(log => ({
      ...log,
      date: new Date(log.date),
      sleep_duration: parseFloat(log.sleep_duration.toString()),
      work_hours: parseFloat(log.work_hours.toString()),
      social_time: parseFloat(log.social_time.toString()),
      screen_time: parseFloat(log.screen_time.toString())
    }));
  } catch (error) {
    console.error('Failed to get logs by date range:', error);
    throw error;
  }
};
