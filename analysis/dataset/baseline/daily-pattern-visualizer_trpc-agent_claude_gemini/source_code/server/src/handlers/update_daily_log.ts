import { db } from '../db';
import { dailyLogsTable } from '../db/schema';
import { type UpdateDailyLogInput, type DailyLog } from '../schema';
import { eq } from 'drizzle-orm';

export const updateDailyLog = async (input: UpdateDailyLogInput): Promise<DailyLog> => {
  try {
    // First, check if the log exists
    const existingLog = await db.select()
      .from(dailyLogsTable)
      .where(eq(dailyLogsTable.id, input.id))
      .execute();

    if (existingLog.length === 0) {
      throw new Error(`Daily log with id ${input.id} not found`);
    }

    // Prepare update values, excluding undefined fields
    const updateValues: any = {
      updated_at: new Date()
    };

    if (input.date !== undefined) {
      updateValues.date = input.date;
    }
    if (input.sleep_duration !== undefined) {
      updateValues.sleep_duration = input.sleep_duration;
    }
    if (input.work_hours !== undefined) {
      updateValues.work_hours = input.work_hours;
    }
    if (input.social_time !== undefined) {
      updateValues.social_time = input.social_time;
    }
    if (input.screen_time !== undefined) {
      updateValues.screen_time = input.screen_time;
    }
    if (input.emotional_energy !== undefined) {
      updateValues.emotional_energy = input.emotional_energy;
    }

    // Update the log
    const result = await db.update(dailyLogsTable)
      .set(updateValues)
      .where(eq(dailyLogsTable.id, input.id))
      .returning()
      .execute();

    const updatedLog = result[0];
    
    // Convert date string to Date object and handle real columns
    return {
      ...updatedLog,
      date: new Date(updatedLog.date),
      sleep_duration: Number(updatedLog.sleep_duration),
      work_hours: Number(updatedLog.work_hours),
      social_time: Number(updatedLog.social_time),
      screen_time: Number(updatedLog.screen_time)
    };
  } catch (error) {
    console.error('Daily log update failed:', error);
    throw error;
  }
};
