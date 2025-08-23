import { db } from '../db';
import { pomodoroLogTable } from '../db/schema';
import { type PomodoroLog } from '../schema';

/**
 * Fetch all Pomodoro log entries from the database.
 * Returns an array of PomodoroLog objects.
 */
export const getPomodoroLogs = async (): Promise<PomodoroLog[]> => {
  try {
    const results = await db.select().from(pomodoroLogTable).execute();
    // No numeric conversions needed as all columns are integers or timestamps
    return results;
  } catch (error) {
    console.error('Failed to fetch pomodoro logs:', error);
    throw error;
  }
};
