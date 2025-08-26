import { db } from '../db';
import { pomodoroLogsTable } from '../db/schema';
import { type GetDailyLogsInput, type PomodoroLog } from '../schema';
import { gte, lt, asc, and } from 'drizzle-orm';

export const getDailyLogs = async (input: GetDailyLogsInput): Promise<PomodoroLog[]> => {
  try {
    // Parse the input date string to create date boundaries
    const targetDate = new Date(input.date);
    
    // Create start of day (00:00:00)
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Create start of next day (00:00:00 next day)
    const startOfNextDay = new Date(targetDate);
    startOfNextDay.setDate(startOfNextDay.getDate() + 1);
    startOfNextDay.setHours(0, 0, 0, 0);
    
    // Query logs for the specific date, ordered by started_at
    const results = await db.select()
      .from(pomodoroLogsTable)
      .where(
        and(
          gte(pomodoroLogsTable.started_at, startOfDay),
          lt(pomodoroLogsTable.started_at, startOfNextDay)
        )
      )
      .orderBy(asc(pomodoroLogsTable.started_at))
      .execute();
    
    // Return the logs (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Failed to get daily logs:', error);
    throw error;
  }
};
