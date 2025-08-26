import { db } from '../db';
import { classesTable, instructorsTable, usersTable, bookingsTable } from '../db/schema';
import { type Class } from '../schema';
import { eq, count } from 'drizzle-orm';

export const getClasses = async (): Promise<Class[]> => {
  try {
    // Get all classes with their instructor information and booking counts
    const results = await db.select({
      // Class fields
      id: classesTable.id,
      name: classesTable.name,
      description: classesTable.description,
      start_time: classesTable.start_time,
      end_time: classesTable.end_time,
      instructor_id: classesTable.instructor_id,
      max_capacity: classesTable.max_capacity,
      created_at: classesTable.created_at,
      // Instructor information
      instructor_name: usersTable.name,
      instructor_specialization: instructorsTable.specialization,
      // Booking count (will be aggregated separately)
      booking_count: count(bookingsTable.id).as('booking_count')
    })
    .from(classesTable)
    .innerJoin(instructorsTable, eq(classesTable.instructor_id, instructorsTable.id))
    .innerJoin(usersTable, eq(instructorsTable.user_id, usersTable.id))
    .leftJoin(bookingsTable, eq(classesTable.id, bookingsTable.class_id))
    .groupBy(
      classesTable.id,
      classesTable.name,
      classesTable.description,
      classesTable.start_time,
      classesTable.end_time,
      classesTable.instructor_id,
      classesTable.max_capacity,
      classesTable.created_at,
      usersTable.name,
      instructorsTable.specialization
    )
    .execute();

    // Return classes in the expected format
    return results.map(result => ({
      id: result.id,
      name: result.name,
      description: result.description,
      start_time: result.start_time,
      end_time: result.end_time,
      instructor_id: result.instructor_id,
      max_capacity: result.max_capacity,
      created_at: result.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
};
