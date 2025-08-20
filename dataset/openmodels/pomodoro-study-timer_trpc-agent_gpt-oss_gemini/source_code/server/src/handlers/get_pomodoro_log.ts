import { type PomodoroLog } from '../schema';
import { db } from '../db';
import { pomodoroLogTable } from '../db/schema';

/**
 * Placeholder handler to fetch all Pomodoro logs.
 * In a real implementation this would query the database for logs of each day.
 */
export const getPomodoroLog = async (): Promise<PomodoroLog[]> => {
  try {
    const rows = await db.select().from(pomodoroLogTable).execute();
    // Convert date to YYYY-MM-DD string
    return rows.map(row => {
      const d: any = row.date;
      const dateStr = d instanceof Date ? d.toISOString().split('T')[0] : d;
      return {
        id: row.id,
        date: dateStr,
        sessions_completed: row.sessions_completed,
      };
    });
  } catch (error) {
    console.error('Failed to fetch pomodoro logs:', error);
    throw error;
  }
};
