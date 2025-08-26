import { db } from '../db';
import { classSchedulesTable, classesTable } from '../db/schema';
import { type CreateClassScheduleInput, type ClassSchedule } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export const createClassSchedule = async (input: CreateClassScheduleInput): Promise<ClassSchedule> => {
  try {
    // First, validate that the class exists and is active
    const classExists = await db.select()
      .from(classesTable)
      .where(and(
        eq(classesTable.id, input.class_id),
        eq(classesTable.is_active, true)
      ))
      .execute();

    if (classExists.length === 0) {
      throw new Error(`Class with ID ${input.class_id} not found or is not active`);
    }

    const classData = classExists[0];

    // Check for scheduling conflicts with the same instructor
    const conflictingSchedules = await db.select()
      .from(classSchedulesTable)
      .innerJoin(classesTable, eq(classSchedulesTable.class_id, classesTable.id))
      .where(and(
        eq(classSchedulesTable.scheduled_date, input.scheduled_date.toISOString().split('T')[0]), // Convert Date to date string
        eq(classesTable.instructor_name, classData.instructor_name),
        eq(classSchedulesTable.is_cancelled, false)
        // Remove the ne condition to allow checking conflicts for same instructor regardless of class
      ))
      .execute();

    // Check for time conflicts
    for (const conflict of conflictingSchedules) {
      const conflictStart = conflict.class_schedules.start_time.slice(0, 5); // Convert to HH:MM format
      const conflictEnd = conflict.class_schedules.end_time.slice(0, 5); // Convert to HH:MM format
      
      // Check if times overlap - two time ranges overlap if:
      // new_start < existing_end AND new_end > existing_start
      if (input.start_time < conflictEnd && input.end_time > conflictStart) {
        throw new Error(`Scheduling conflict: Instructor ${classData.instructor_name} is already scheduled from ${conflictStart} to ${conflictEnd} on ${input.scheduled_date.toISOString().split('T')[0]}`);
      }
    }

    // Validate that start_time is before end_time
    if (input.start_time >= input.end_time) {
      throw new Error('Start time must be before end time');
    }

    // Insert the class schedule
    const result = await db.insert(classSchedulesTable)
      .values({
        class_id: input.class_id,
        scheduled_date: input.scheduled_date.toISOString().split('T')[0], // Convert Date to date string for the date column
        start_time: input.start_time,
        end_time: input.end_time,
        current_bookings: 0,
        is_cancelled: false,
        cancellation_reason: null
      })
      .returning()
      .execute();

    const schedule = result[0];
    return {
      ...schedule,
      scheduled_date: new Date(schedule.scheduled_date + 'T00:00:00.000Z'), // Convert date string back to Date object
      start_time: schedule.start_time.slice(0, 5), // Convert "HH:MM:SS" to "HH:MM"
      end_time: schedule.end_time.slice(0, 5) // Convert "HH:MM:SS" to "HH:MM"
    };
  } catch (error) {
    console.error('Class schedule creation failed:', error);
    throw error;
  }
};
