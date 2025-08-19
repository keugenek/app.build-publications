import { db } from '../db';
import { classSchedulesTable, classesTable } from '../db/schema';
import { type GetClassSchedulesQuery, type ClassSchedule } from '../schema';
import { eq, and, gte, lte, type SQL } from 'drizzle-orm';

export async function getClassSchedules(query?: GetClassSchedulesQuery): Promise<ClassSchedule[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (query) {
      // Filter by start date (schedules starting on or after this date)
      if (query.start_date) {
        conditions.push(gte(classSchedulesTable.start_time, query.start_date));
      }

      // Filter by end date (schedules starting before or on this date)
      if (query.end_date) {
        conditions.push(lte(classSchedulesTable.start_time, query.end_date));
      }

      // Filter by class type
      if (query.class_type) {
        conditions.push(eq(classesTable.class_type, query.class_type));
      }
    }

    // Build the query with proper conditional where clause
    const baseQuery = db.select({
      id: classSchedulesTable.id,
      class_id: classSchedulesTable.class_id,
      start_time: classSchedulesTable.start_time,
      end_time: classSchedulesTable.end_time,
      room_name: classSchedulesTable.room_name,
      is_cancelled: classSchedulesTable.is_cancelled,
      created_at: classSchedulesTable.created_at,
      updated_at: classSchedulesTable.updated_at
    })
    .from(classSchedulesTable)
    .innerJoin(classesTable, eq(classSchedulesTable.class_id, classesTable.id));

    // Apply conditions using ternary operator to maintain type consistency
    const finalQuery = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    // Execute the query
    const results = await finalQuery.execute();

    // Return the results - no numeric conversion needed as all fields are appropriate types
    return results;
  } catch (error) {
    console.error('Failed to fetch class schedules:', error);
    throw error;
  }
}
