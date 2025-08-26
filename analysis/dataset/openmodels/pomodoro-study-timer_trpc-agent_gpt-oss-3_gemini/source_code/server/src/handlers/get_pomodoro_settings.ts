import { type PomodoroSettings } from '../schema';
import { db } from '../db';
import { pomodoroSettingsTable } from '../db/schema';

/**
 * Placeholder handler to fetch Pomodoro settings.
 * Real implementation should query the pomodoro_settings table (single row).
 */
export const getPomodoroSettings = async (): Promise<PomodoroSettings> => {
  try {
    // Try to fetch existing settings (there should be at most one row)
    const existing = await db.select().from(pomodoroSettingsTable).limit(1).execute();
    if (existing.length > 0) {
      return existing[0];
    }
    // No settings row yet – insert a new one using DB defaults
    const inserted = await db
      .insert(pomodoroSettingsTable)
      .values({}) // rely on column defaults for work_interval and break_interval
      .returning()
      .execute();
    return inserted[0];
  } catch (error) {
    console.error('Failed to get pomodoro settings:', error);
    throw error;
  }
};

