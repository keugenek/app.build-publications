import { db } from '../db';
import { classSchedulesTable, classesTable } from '../db/schema';
import { type CreateClassScheduleInput, type ClassSchedule } from '../schema';
import { eq } from 'drizzle-orm';

export const createClassSchedule = async (input: CreateClassScheduleInput): Promise<ClassSchedule> => {
  try {
    // First, verify the class exists and get its duration
    const classResults = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .execute();

    if (classResults.length === 0) {
      throw new Error(`Class with id ${input.class_id} not found`);
    }

    const classData = classResults[0];
    
    // Calculate end_time based on class duration
    const startTime = new Date(input.start_time);
    const endTime = new Date(startTime.getTime() + classData.duration_minutes * 60 * 1000);

    // Insert the class schedule record
    const result = await db.insert(classSchedulesTable)
      .values({
        class_id: input.class_id,
        start_time: startTime,
        end_time: endTime,
        room_name: input.room_name,
        is_cancelled: false
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Class schedule creation failed:', error);
    throw error;
  }
};
