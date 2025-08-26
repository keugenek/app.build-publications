import { db } from '../db';
import { bookingsTable, classSchedulesTable, classesTable } from '../db/schema';
import { type GetUserBookingsQuery, type Booking } from '../schema';
import { eq, gte, lte, and, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getUserBookings(query: GetUserBookingsQuery): Promise<Booking[]> {
  try {
    // Build base query with joins to get class details
    let baseQuery = db.select({
      id: bookingsTable.id,
      user_id: bookingsTable.user_id,
      class_schedule_id: bookingsTable.class_schedule_id,
      status: bookingsTable.status,
      booked_at: bookingsTable.booked_at,
      updated_at: bookingsTable.updated_at
    })
    .from(bookingsTable)
    .innerJoin(classSchedulesTable, eq(bookingsTable.class_schedule_id, classSchedulesTable.id))
    .innerJoin(classesTable, eq(classSchedulesTable.class_id, classesTable.id));

    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [
      eq(bookingsTable.user_id, query.user_id)
    ];

    // Add date filters if provided
    if (query.start_date) {
      conditions.push(gte(classSchedulesTable.start_time, query.start_date));
    }

    if (query.end_date) {
      conditions.push(lte(classSchedulesTable.start_time, query.end_date));
    }

    // Apply where clause with all conditions
    const finalQuery = baseQuery
      .where(and(...conditions))
      .orderBy(desc(classSchedulesTable.start_time));

    const results = await finalQuery.execute();

    return results;
  } catch (error) {
    console.error('Failed to get user bookings:', error);
    throw error;
  }
}
