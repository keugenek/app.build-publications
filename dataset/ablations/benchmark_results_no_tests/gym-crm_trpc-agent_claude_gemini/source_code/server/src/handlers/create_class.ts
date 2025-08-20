import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput, type Class } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createClass = async (input: CreateClassInput): Promise<Class> => {
  try {
    // Check for scheduling conflicts with the same instructor
    const conflictingClasses = await db.select()
      .from(classesTable)
      .where(
        and(
          eq(classesTable.instructor_name, input.instructor_name),
          eq(classesTable.class_date, input.class_date.toISOString().split('T')[0]), // Convert Date to YYYY-MM-DD string
          eq(classesTable.start_time, input.start_time)
        )
      )
      .execute();

    if (conflictingClasses.length > 0) {
      throw new Error(`Instructor ${input.instructor_name} already has a class scheduled at ${input.start_time} on ${input.class_date.toISOString().split('T')[0]}`);
    }

    // Insert new class record
    const result = await db.insert(classesTable)
      .values({
        name: input.name,
        description: input.description,
        instructor_name: input.instructor_name,
        duration_minutes: input.duration_minutes,
        max_capacity: input.max_capacity,
        current_bookings: 0, // New class starts with no bookings
        class_date: input.class_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        start_time: input.start_time,
        status: input.status
      })
      .returning()
      .execute();

    const newClass = result[0];
    
    // Return with proper date conversion
    return {
      ...newClass,
      class_date: new Date(newClass.class_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Class creation failed:', error);
    throw error;
  }
};
