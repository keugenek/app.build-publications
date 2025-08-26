import { db } from '../db';
import { classesTable, instructorsTable, bookingsTable } from '../db/schema';
import { type UpdateClassInput, type Class } from '../schema';
import { eq, and, or, lt, gt, count } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const updateClass = async (input: UpdateClassInput): Promise<Class> => {
  try {
    // First, verify the class exists
    const existingClasses = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.id))
      .execute();

    if (existingClasses.length === 0) {
      throw new Error(`Class with id ${input.id} not found`);
    }

    const existingClass = existingClasses[0];

    // Validate instructor exists if instructor_id is being updated
    if (input.instructor_id !== undefined) {
      const instructors = await db.select()
        .from(instructorsTable)
        .where(eq(instructorsTable.id, input.instructor_id))
        .execute();

      if (instructors.length === 0) {
        throw new Error(`Instructor with id ${input.instructor_id} not found`);
      }
    }

    // Check for scheduling conflicts if time is being updated
    if (input.start_time !== undefined || input.end_time !== undefined) {
      const newStartTime = input.start_time || existingClass.start_time;
      const newEndTime = input.end_time || existingClass.end_time;
      const checkInstructorId = input.instructor_id || existingClass.instructor_id;

      // Validate that start_time is before end_time
      if (newStartTime >= newEndTime) {
        throw new Error('Start time must be before end time');
      }

      // Check for scheduling conflicts with other classes for the same instructor
      const conflictingClasses = await db.select()
        .from(classesTable)
        .where(eq(classesTable.instructor_id, checkInstructorId))
        .execute();

      // Check for time overlap with any existing class (excluding current class)
      const hasConflict = conflictingClasses.some(cls => {
        if (cls.id === input.id) return false; // Skip the class being updated
        
        return (
          // New class starts during existing class
          (newStartTime >= cls.start_time && newStartTime < cls.end_time) ||
          // New class ends during existing class
          (newEndTime > cls.start_time && newEndTime <= cls.end_time) ||
          // New class completely encompasses existing class
          (newStartTime <= cls.start_time && newEndTime >= cls.end_time)
        );
      });

      if (hasConflict) {
        throw new Error('Scheduling conflict: Instructor has another class at the same time');
      }
    }

    // Handle capacity reduction - check if it would exceed confirmed bookings
    if (input.max_capacity !== undefined && input.max_capacity < existingClass.max_capacity) {
      const confirmedBookingsCount = await db.select({ count: count() })
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.class_id, input.id),
            eq(bookingsTable.booking_status, 'confirmed')
          )
        )
        .execute();

      const currentConfirmedCount = confirmedBookingsCount[0].count;
      
      if (input.max_capacity < currentConfirmedCount) {
        throw new Error(`Cannot reduce capacity to ${input.max_capacity}. There are ${currentConfirmedCount} confirmed bookings.`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.start_time !== undefined) updateData.start_time = input.start_time;
    if (input.end_time !== undefined) updateData.end_time = input.end_time;
    if (input.instructor_id !== undefined) updateData.instructor_id = input.instructor_id;
    if (input.max_capacity !== undefined) updateData.max_capacity = input.max_capacity;

    // Update the class
    const result = await db.update(classesTable)
      .set(updateData)
      .where(eq(classesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Class update failed:', error);
    throw error;
  }
};
