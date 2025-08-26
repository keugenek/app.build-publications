import { db } from '../db';
import { pomodoroSettingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdatePomodoroSettingsInput, type PomodoroSettings } from '../schema';

/**
 * Updates Pomodoro settings identified by `id`.
 * Only fields provided in `input` are updated; missing fields retain their current values.
 * Returns the updated settings row.
 */
export const updatePomodoroSettings = async (
  input: UpdatePomodoroSettingsInput,
): Promise<PomodoroSettings> => {
  // Build the update payload conditionally
  const updateData: Partial<PomodoroSettings> = {};
  if (input.work_interval !== undefined) {
    updateData.work_interval = input.work_interval;
  }
  if (input.break_interval !== undefined) {
    updateData.break_interval = input.break_interval;
  }

  // Perform the update and return the updated row
  const result = await db
    .update(pomodoroSettingsTable)
    .set(updateData)
    .where(eq(pomodoroSettingsTable.id, input.id))
    .returning()
    .execute();

  if (result.length === 0) {
    // No row found with given id – throw an error
    throw new Error(`Pomodoro settings with id ${input.id} not found`);
  }

  // result[0] matches PomodoroSettings type
  return result[0];
};
