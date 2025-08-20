import { db } from '../db';
import { pomodoroSettingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { UpdatePomodoroSettingsInput } from '../schema';
import type { NewPomodoroSettings } from '../db/schema';

export const updatePomodoroSettings = async (input: UpdatePomodoroSettingsInput): Promise<void> => {
  // If no fields provided, nothing to do
  if (input.work_minutes === undefined && input.break_minutes === undefined) {
    return;
  }

  // Ensure a settings row exists; if not, insert a default row
  let settings = await db.select().from(pomodoroSettingsTable).limit(1).execute();
  if (settings.length === 0) {
    // Insert a row with defaults (the DB defaults will apply)
    const inserted = await db.insert(pomodoroSettingsTable).values({}).returning().execute();
    settings = inserted;
  }

  const row = settings[0];
  const updates: Partial<NewPomodoroSettings> = {};
  if (input.work_minutes !== undefined) updates.work_minutes = input.work_minutes;
  if (input.break_minutes !== undefined) updates.break_minutes = input.break_minutes;

  if (Object.keys(updates).length > 0) {
    await db.update(pomodoroSettingsTable)
      .set(updates)
      .where(eq(pomodoroSettingsTable.id, row.id))
      .execute();
  }
};
