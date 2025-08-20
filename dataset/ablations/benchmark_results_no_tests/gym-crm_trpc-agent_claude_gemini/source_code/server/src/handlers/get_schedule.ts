import { db } from '../db';
import { classesTable } from '../db/schema';
import { type GetScheduleInput, type ScheduleView } from '../schema';
import { and, gte, lte, inArray } from 'drizzle-orm';

export const getSchedule = async (input: GetScheduleInput): Promise<ScheduleView[]> => {
  try {
    // Query classes within the date range with only scheduled or in_progress status
    const results = await db.select()
      .from(classesTable)
      .where(
        and(
          gte(classesTable.class_date, input.start_date.toISOString().split('T')[0]), // Convert Date to YYYY-MM-DD
          lte(classesTable.class_date, input.end_date.toISOString().split('T')[0]), // Convert Date to YYYY-MM-DD
          inArray(classesTable.status, ['scheduled', 'in_progress'])
        )
      )
      .execute();

    // Transform results to include calculated available spots
    return results.map(classData => ({
      id: classData.id,
      name: classData.name,
      description: classData.description,
      instructor_name: classData.instructor_name,
      duration_minutes: classData.duration_minutes,
      max_capacity: classData.max_capacity,
      current_bookings: classData.current_bookings,
      available_spots: classData.max_capacity - classData.current_bookings,
      class_date: new Date(classData.class_date), // Convert string date to Date object
      start_time: classData.start_time,
      status: classData.status
    }));
  } catch (error) {
    console.error('Schedule fetch failed:', error);
    throw error;
  }
};
