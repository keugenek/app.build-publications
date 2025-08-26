import { type PomodoroSettings, type UpdatePomodoroSettingsInput } from '../schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { pomodoroSettingsTable } from '../db/schema';

export const getPomodoroSettings = async (): Promise<PomodoroSettings> => {
  // Fetch the first (or default) Pomodoro settings from the database
  const settings = await db.select().from(pomodoroSettingsTable).limit(1);
  
  if (settings.length === 0) {
    // Create default settings if none exist
    const [defaultSettings] = await db.insert(pomodoroSettingsTable).values({
      workDuration: 25 * 60, // 25 minutes in seconds
      shortBreakDuration: 5 * 60, // 5 minutes in seconds
      longBreakDuration: 15 * 60, // 15 minutes in seconds
      longBreakInterval: 4, // Every 4 pomodoros
    }).returning();
    
    return defaultSettings as PomodoroSettings;
  }
  
  return settings[0] as PomodoroSettings;
};

export const updatePomodoroSettings = async (input: UpdatePomodoroSettingsInput): Promise<PomodoroSettings> => {
  try {
    // Build the update object with only provided values
    const updateData: Partial<typeof pomodoroSettingsTable.$inferInsert> = {};
    
    if (input.workDuration !== undefined) {
      updateData.workDuration = input.workDuration;
    }
    if (input.shortBreakDuration !== undefined) {
      updateData.shortBreakDuration = input.shortBreakDuration;
    }
    if (input.longBreakDuration !== undefined) {
      updateData.longBreakDuration = input.longBreakDuration;
    }
    if (input.longBreakInterval !== undefined) {
      updateData.longBreakInterval = input.longBreakInterval;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the Pomodoro settings in the database
    const result = await db.update(pomodoroSettingsTable)
      .set(updateData)
      .where(eq(pomodoroSettingsTable.id, input.id))
      .returning();

    // If no rows were updated, throw an error
    if (result.length === 0) {
      throw new Error(`Pomodoro settings with id ${input.id} not found`);
    }

    return result[0] as PomodoroSettings;
  } catch (error) {
    console.error('Failed to update Pomodoro settings:', error);
    throw error;
  }
};
