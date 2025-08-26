import { db } from '../db';
import { activityLogsTable } from '../db/schema';
import { type UpdateActivityLogInput, type ActivityLog } from '../schema';
import { eq } from 'drizzle-orm';

export const updateActivityLog = async (input: UpdateActivityLogInput): Promise<ActivityLog> => {
  try {
    // First, check if the activity log exists
    const existingLog = await db.select()
      .from(activityLogsTable)
      .where(eq(activityLogsTable.id, input.id))
      .execute();

    if (existingLog.length === 0) {
      throw new Error(`Activity log with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.sleep_hours !== undefined) {
      updateData.sleep_hours = input.sleep_hours.toString();
    }
    if (input.work_hours !== undefined) {
      updateData.work_hours = input.work_hours.toString();
    }
    if (input.social_hours !== undefined) {
      updateData.social_hours = input.social_hours.toString();
    }
    if (input.screen_hours !== undefined) {
      updateData.screen_hours = input.screen_hours.toString();
    }
    if (input.emotional_energy !== undefined) {
      updateData.emotional_energy = input.emotional_energy;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update the activity log
    const result = await db.update(activityLogsTable)
      .set(updateData)
      .where(eq(activityLogsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers and date to Date object before returning
    const updatedLog = result[0];
    return {
      ...updatedLog,
      date: new Date(updatedLog.date),
      sleep_hours: parseFloat(updatedLog.sleep_hours),
      work_hours: parseFloat(updatedLog.work_hours),
      social_hours: parseFloat(updatedLog.social_hours),
      screen_hours: parseFloat(updatedLog.screen_hours)
    };
  } catch (error) {
    console.error('Activity log update failed:', error);
    throw error;
  }
};
