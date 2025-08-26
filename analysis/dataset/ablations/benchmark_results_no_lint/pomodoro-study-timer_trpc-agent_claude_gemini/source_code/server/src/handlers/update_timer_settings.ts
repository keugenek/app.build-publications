import { db } from '../db';
import { timerSettingsTable } from '../db/schema';
import { type UpdateTimerSettingsInput, type TimerSettings } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const updateTimerSettings = async (input: UpdateTimerSettingsInput): Promise<TimerSettings> => {
  try {
    // First, check if any settings record exists
    const existingSettings = await db.select()
      .from(timerSettingsTable)
      .limit(1)
      .execute();

    if (existingSettings.length === 0) {
      // No settings exist, create new record with provided values and defaults
      const result = await db.insert(timerSettingsTable)
        .values({
          work_duration_minutes: input.work_duration_minutes ?? 25,
          break_duration_minutes: input.break_duration_minutes ?? 5,
          audio_enabled: input.audio_enabled ?? true
        })
        .returning()
        .execute();

      return result[0];
    } else {
      // Update existing settings record (use the first one)
      const settingsId = existingSettings[0].id;
      
      // Build update object with only provided fields
      const updateData: any = {
        updated_at: sql`now()` // Set updated_at to current timestamp
      };

      if (input.work_duration_minutes !== undefined) {
        updateData.work_duration_minutes = input.work_duration_minutes;
      }
      
      if (input.break_duration_minutes !== undefined) {
        updateData.break_duration_minutes = input.break_duration_minutes;
      }
      
      if (input.audio_enabled !== undefined) {
        updateData.audio_enabled = input.audio_enabled;
      }

      const result = await db.update(timerSettingsTable)
        .set(updateData)
        .where(eq(timerSettingsTable.id, settingsId))
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('Timer settings update failed:', error);
    throw error;
  }
};
