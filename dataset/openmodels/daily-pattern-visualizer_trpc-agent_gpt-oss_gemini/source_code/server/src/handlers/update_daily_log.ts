import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateDailyLogInput, type DailyLog } from '../schema';

/**
 * Updates a daily log entry in the database.
 * Only the fields provided in the input are updated; omitted fields retain their existing values.
 * Returns the fully populated updated DailyLog record.
 */
export const updateDailyLog = async (input: UpdateDailyLogInput): Promise<DailyLog> => {
  try {
    // Build an object with only the fields that are present in the input
    const updates: Partial<typeof dailyLogsTable.$inferInsert> = {};

    if (input.logged_at !== undefined) {
      updates.logged_at = input.logged_at;
    }
    if (input.sleep_hours !== undefined) {
      updates.sleep_hours = input.sleep_hours;
    }
    if (input.work_hours !== undefined) {
      updates.work_hours = input.work_hours;
    }
    if (input.social_hours !== undefined) {
      updates.social_hours = input.social_hours;
    }
    if (input.screen_hours !== undefined) {
      updates.screen_hours = input.screen_hours;
    }
    if (input.emotional_energy !== undefined) {
      updates.emotional_energy = input.emotional_energy;
    }

    // Perform the update and return the updated row
    const result = await db
      .update(dailyLogsTable)
      .set(updates)
      .where(eq(dailyLogsTable.id, input.id))
      .returning()
      .execute();

    // If no rows were affected, throw an error (could be handled differently in real app)
    if (result.length === 0) {
      throw new Error(`DailyLog with id ${input.id} not found`);
    }

    // The returning row already has proper JS types (real -> number, integer -> number, timestamp -> Date)
    return result[0];
  } catch (error) {
    console.error('Failed to update daily log:', error);
    throw error;
  }
};
