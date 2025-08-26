import { type UpdatePomodoroSettingsInput, type PomodoroSettings } from '../schema';
import { db } from '../db';
import { pomodoroSettingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const updatePomodoroSettings = async (input: UpdatePomodoroSettingsInput): Promise<PomodoroSettings> => {
  try {
    // Build update object with only provided fields
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
    
    // Only add updated_at if we're actually updating something
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date();
    }
    
    // If no fields to update, just return the existing record
    if (Object.keys(updateData).length === 0) {
      const existingSettings = await db.select()
        .from(pomodoroSettingsTable)
        .where(eq(pomodoroSettingsTable.id, input.id))
        .execute();
      
      if (existingSettings.length === 0) {
        throw new Error('Pomodoro settings not found');
      }
      
      return existingSettings[0] as PomodoroSettings;
    }
    
    // Update existing Pomodoro settings in the database
    const settings = await db.update(pomodoroSettingsTable)
      .set(updateData)
      .where(eq(pomodoroSettingsTable.id, input.id))
      .returning();
    
    if (settings.length === 0) {
      throw new Error('Pomodoro settings not found');
    }
    
    return settings[0] as PomodoroSettings;
  } catch (error) {
    console.error('Failed to update Pomodoro settings:', error);
    throw error;
  }
};
