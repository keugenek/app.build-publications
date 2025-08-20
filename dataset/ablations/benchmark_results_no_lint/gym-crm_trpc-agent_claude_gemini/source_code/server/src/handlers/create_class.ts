import { db } from '../db';
import { classesTable, instructorsTable } from '../db/schema';
import { type CreateClassInput, type Class } from '../schema';
import { eq, and, or, lt, gt } from 'drizzle-orm';

export const createClass = async (input: CreateClassInput): Promise<Class> => {
  try {
    // Validate that start_time is before end_time
    if (input.start_time >= input.end_time) {
      throw new Error('Start time must be before end time');
    }

    // Validate that instructor exists
    const instructor = await db.select()
      .from(instructorsTable)
      .where(eq(instructorsTable.id, input.instructor_id))
      .execute();

    if (instructor.length === 0) {
      throw new Error('Instructor not found');
    }

    // Check for scheduling conflicts with the same instructor
    const conflictingClasses = await db.select()
      .from(classesTable)
      .where(
        and(
          eq(classesTable.instructor_id, input.instructor_id),
          or(
            // New class starts during existing class
            and(
              lt(classesTable.start_time, input.start_time),
              gt(classesTable.end_time, input.start_time)
            ),
            // New class ends during existing class
            and(
              lt(classesTable.start_time, input.end_time),
              gt(classesTable.end_time, input.end_time)
            ),
            // New class completely contains existing class
            and(
              gt(classesTable.start_time, input.start_time),
              lt(classesTable.end_time, input.end_time)
            ),
            // Existing class completely contains new class
            and(
              lt(classesTable.start_time, input.start_time),
              gt(classesTable.end_time, input.end_time)
            )
          )
        )
      )
      .execute();

    if (conflictingClasses.length > 0) {
      throw new Error('Instructor has a scheduling conflict during this time');
    }

    // Insert class record
    const result = await db.insert(classesTable)
      .values({
        name: input.name,
        description: input.description ?? null,
        start_time: input.start_time,
        end_time: input.end_time,
        instructor_id: input.instructor_id,
        max_capacity: input.max_capacity
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Class creation failed:', error);
    throw error;
  }
};
