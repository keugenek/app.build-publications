import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type DailyLog } from '../schema';

// Handler for fetching all daily logs.
export const getDailyLogs = async (): Promise<DailyLog[]> => {
  try {
    const results = await db.select().from(dailyLogsTable).execute();
    // results already conform to DailyLog type
    return results;
  } catch (error) {
    console.error('Failed to fetch daily logs:', error);
    throw error;
  }
};
