import { db } from '../db';
import { timerSettingsTable } from '../db/schema';
import { type TimerSettings } from '../schema';

export const getTimerSettings = async (): Promise<TimerSettings> => {
  try {
    // Try to fetch existing timer settings
    const settings = await db.select()
      .from(timerSettingsTable)
      .limit(1)
      .execute();

    if (settings.length > 0) {
      // Return existing settings
      return settings[0];
    }

    // No settings exist, create default settings
    const defaultSettings = await db.insert(timerSettingsTable)
      .values({
        work_duration: 25, // default 25 minutes
        break_duration: 5  // default 5 minutes
      })
      .returning()
      .execute();

    return defaultSettings[0];
  } catch (error) {
    console.error('Failed to get timer settings:', error);
    throw error;
  }
};
