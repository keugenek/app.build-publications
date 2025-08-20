import { db } from '../db';
import { classSchedulesTable, classesTable } from '../db/schema';
import { type GetClassSchedulesInput, type ClassSchedule } from '../schema';
import { eq, gte, lte, and, type SQL } from 'drizzle-orm';

export const getClassSchedules = async (input?: GetClassSchedulesInput): Promise<ClassSchedule[]> => {
  try {
    // Start with base query joining schedules with classes for filtering by class_type
    let query = db.select({
      id: classSchedulesTable.id,
      class_id: classSchedulesTable.class_id,
      scheduled_date: classSchedulesTable.scheduled_date,
      start_time: classSchedulesTable.start_time,
      end_time: classSchedulesTable.end_time,
      current_bookings: classSchedulesTable.current_bookings,
      is_cancelled: classSchedulesTable.is_cancelled,
      cancellation_reason: classSchedulesTable.cancellation_reason,
      created_at: classSchedulesTable.created_at,
      updated_at: classSchedulesTable.updated_at
    })
    .from(classSchedulesTable)
    .innerJoin(classesTable, eq(classSchedulesTable.class_id, classesTable.id));

    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input?.date_from) {
      // Convert Date to string for comparison with date column
      const dateString = input.date_from.toISOString().split('T')[0];
      conditions.push(gte(classSchedulesTable.scheduled_date, dateString));
    }

    if (input?.date_to) {
      // Convert Date to string for comparison with date column
      const dateString = input.date_to.toISOString().split('T')[0];
      conditions.push(lte(classSchedulesTable.scheduled_date, dateString));
    }

    if (input?.class_id) {
      conditions.push(eq(classSchedulesTable.class_id, input.class_id));
    }

    if (input?.class_type) {
      conditions.push(eq(classesTable.class_type, input.class_type));
    }

    // Apply conditions and complete the query
    const finalQuery = conditions.length > 0 
      ? query.where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(classSchedulesTable.scheduled_date, classSchedulesTable.start_time)
      : query.orderBy(classSchedulesTable.scheduled_date, classSchedulesTable.start_time);

    const results = await finalQuery.execute();

    // Transform results to match ClassSchedule schema - convert string date back to Date
    return results.map(result => ({
      id: result.id,
      class_id: result.class_id,
      scheduled_date: new Date(result.scheduled_date),
      start_time: result.start_time,
      end_time: result.end_time,
      current_bookings: result.current_bookings,
      is_cancelled: result.is_cancelled,
      cancellation_reason: result.cancellation_reason,
      created_at: result.created_at,
      updated_at: result.updated_at
    }));
  } catch (error) {
    console.error('Get class schedules failed:', error);
    throw error;
  }
};
