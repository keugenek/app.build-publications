import { db } from '../db';
import { classSchedulesTable, classesTable } from '../db/schema';
import { type UpdateClassScheduleInput, type ClassSchedule } from '../schema';
import { eq } from 'drizzle-orm';

export const updateClassSchedule = async (input: UpdateClassScheduleInput): Promise<ClassSchedule> => {
  try {
    // First, verify the class schedule exists
    const existingSchedule = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, input.id))
      .execute();

    if (existingSchedule.length === 0) {
      throw new Error(`Class schedule with id ${input.id} not found`);
    }

    const current = existingSchedule[0];

    // Calculate end_time if start_time is being updated
    let end_time = current.end_time;
    if (input.start_time) {
      // Get the class duration to calculate new end time
      const classInfo = await db.select({ duration_minutes: classesTable.duration_minutes })
        .from(classesTable)
        .where(eq(classesTable.id, current.class_id))
        .execute();

      if (classInfo.length > 0) {
        end_time = new Date(input.start_time.getTime() + (classInfo[0].duration_minutes * 60 * 1000));
      }
    }

    // Update the class schedule
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.start_time !== undefined) {
      updateData.start_time = input.start_time;
      updateData.end_time = end_time;
    }

    if (input.room_name !== undefined) {
      updateData.room_name = input.room_name;
    }

    if (input.is_cancelled !== undefined) {
      updateData.is_cancelled = input.is_cancelled;
    }

    const result = await db.update(classSchedulesTable)
      .set(updateData)
      .where(eq(classSchedulesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Class schedule update failed:', error);
    throw error;
  }
};
