import { type PomodoroSettings } from '../schema';
import { db } from '../db';
import { pomodoroSettingsTable } from '../db/schema';

/**
 * Retrieve the pomodoro settings. If no settings row exists, a default row is created
 * using the database defaults (work_minutes: 25, break_minutes: 5).
 */
export const getPomodoroSettings = async (): Promise<PomodoroSettings> => {
  try {
    const result = await db
      .select()
      .from(pomodoroSettingsTable)
      .limit(1)
      .execute();

    // If the settings table is empty, insert a row with default values
    if (result.length === 0) {
      const inserted = await db
        .insert(pomodoroSettingsTable)
        .values({})
        .returning()
        .execute();
      const row = inserted[0];
      return {
        id: row.id,
        work_minutes: row.work_minutes,
        break_minutes: row.break_minutes,
        created_at: new Date(row.created_at),
      };
    }

    const row = result[0];
    return {
      id: row.id,
      work_minutes: row.work_minutes,
      break_minutes: row.break_minutes,
      created_at: new Date(row.created_at),
    };
  } catch (error) {
    console.error('Failed to get pomodoro settings:', error);
    throw error;
  }
};
