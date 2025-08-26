import { db } from '../db';
import { pomodoroSettingsTable } from '../db/schema';
import { type CreatePomodoroSettingsInput, type PomodoroSettings } from '../schema';

/**
 * Creates a new Pomodoro settings record.
 * If a field is omitted, the database default value is used.
 */
export const createPomodoroSettings = async (
  input: CreatePomodoroSettingsInput,
): Promise<PomodoroSettings> => {
  try {
    // Build the values object conditionally so that omitted fields trigger DB defaults
    const values: Partial<PomodoroSettings> = {};
    if (input.work_interval !== undefined) {
      values.work_interval = input.work_interval;
    }
    if (input.break_interval !== undefined) {
      values.break_interval = input.break_interval;
    }

    const result = await db
      .insert(pomodoroSettingsTable)
      .values(values as any)
      .returning()
      .execute();

    // The insert returns an array with the newly created row
    return result[0];
  } catch (error) {
    console.error('Failed to create pomodoro settings:', error);
    throw error;
  }
};
