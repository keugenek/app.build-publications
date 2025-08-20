import { db } from '../db';
import { timerSettingsTable } from '../db/schema';
import { type UpdateTimerSettingsInput, type TimerSettings } from '../schema';
import { sql } from 'drizzle-orm';

export const updateTimerSettings = async (input: UpdateTimerSettingsInput): Promise<TimerSettings> => {
  try {
    // Use PostgreSQL's ON CONFLICT for upsert functionality
    // Since we expect only one timer settings record, we'll use id = 1
    const result = await db.insert(timerSettingsTable)
      .values({
        id: 1, // Single settings record
        work_duration: input.work_duration ?? 25, // Use defaults if not provided
        break_duration: input.break_duration ?? 5,
        updated_at: sql`NOW()` // Update the timestamp
      })
      .onConflictDoUpdate({
        target: timerSettingsTable.id,
        set: {
          // Only update fields that were provided in the input
          ...(input.work_duration !== undefined && { work_duration: input.work_duration }),
          ...(input.break_duration !== undefined && { break_duration: input.break_duration }),
          updated_at: sql`NOW()`
        }
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Timer settings update failed:', error);
    throw error;
  }
};
