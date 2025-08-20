import { db } from '../db';
import { timerSettingsTable } from '../db/schema';
import { type TimerSettings } from '../schema';

export const getTimerSettings = async (): Promise<TimerSettings> => {
  try {
    // Try to fetch existing settings
    const existingSettings = await db.select()
      .from(timerSettingsTable)
      .limit(1)
      .execute();

    // If settings exist, return the first one
    if (existingSettings.length > 0) {
      return existingSettings[0];
    }

    // If no settings exist, create and return default settings
    const defaultSettings = await db.insert(timerSettingsTable)
      .values({
        work_duration_minutes: 25,
        break_duration_minutes: 5,
        audio_enabled: true
      })
      .returning()
      .execute();

    return defaultSettings[0];
  } catch (error) {
    console.error('Failed to get timer settings:', error);
    throw error;
  }
};
