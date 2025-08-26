import { db } from '../db';
import { classSchedulesTable } from '../db/schema';
import { type UpdateClassScheduleInput, type ClassSchedule } from '../schema';
import { eq } from 'drizzle-orm';

export const updateClassSchedule = async (input: UpdateClassScheduleInput): Promise<ClassSchedule> => {
  try {
    // First, get the current schedule to check if it exists and for validation
    const currentSchedule = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, input.id))
      .execute();

    if (currentSchedule.length === 0) {
      throw new Error(`Class schedule with id ${input.id} not found`);
    }

    const existing = currentSchedule[0];

    // Prevent updates to past scheduled classes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduledDate = new Date(existing.scheduled_date);
    
    if (scheduledDate < today) {
      throw new Error('Cannot update past scheduled classes');
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.class_id !== undefined) {
      updateData.class_id = input.class_id;
    }
    if (input.scheduled_date !== undefined) {
      updateData.scheduled_date = input.scheduled_date;
    }
    if (input.start_time !== undefined) {
      updateData.start_time = input.start_time;
    }
    if (input.end_time !== undefined) {
      updateData.end_time = input.end_time;
    }
    if (input.is_cancelled !== undefined) {
      updateData.is_cancelled = input.is_cancelled;
    }
    if (input.cancellation_reason !== undefined) {
      updateData.cancellation_reason = input.cancellation_reason;
    }

    // Update the class schedule
    const result = await db.update(classSchedulesTable)
      .set(updateData)
      .where(eq(classSchedulesTable.id, input.id))
      .returning()
      .execute();

    const schedule = result[0];
    return {
      ...schedule,
      scheduled_date: new Date(schedule.scheduled_date)
    };
  } catch (error) {
    console.error('Class schedule update failed:', error);
    throw error;
  }
};
