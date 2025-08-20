import { db } from '../db';
import { bookingsTable, membersTable, classSchedulesTable, classesTable } from '../db/schema';
import { type GetBookingsInput, type Booking } from '../schema';
import { eq, and, gte, lte, desc, type SQL } from 'drizzle-orm';

export async function getBookings(input?: GetBookingsInput): Promise<Booking[]> {
  try {
    // Start with base query - join with related tables for complete booking information
    let baseQuery = db.select({
      id: bookingsTable.id,
      member_id: bookingsTable.member_id,
      class_schedule_id: bookingsTable.class_schedule_id,
      booking_status: bookingsTable.booking_status,
      booking_date: bookingsTable.booking_date,
      cancellation_date: bookingsTable.cancellation_date,
      attendance_marked_at: bookingsTable.attendance_marked_at,
      created_at: bookingsTable.created_at,
      updated_at: bookingsTable.updated_at
    })
    .from(bookingsTable)
    .innerJoin(membersTable, eq(bookingsTable.member_id, membersTable.id))
    .innerJoin(classSchedulesTable, eq(bookingsTable.class_schedule_id, classSchedulesTable.id))
    .innerJoin(classesTable, eq(classSchedulesTable.class_id, classesTable.id));

    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input?.member_id !== undefined) {
      conditions.push(eq(bookingsTable.member_id, input.member_id));
    }

    if (input?.class_schedule_id !== undefined) {
      conditions.push(eq(bookingsTable.class_schedule_id, input.class_schedule_id));
    }

    if (input?.booking_status !== undefined) {
      conditions.push(eq(bookingsTable.booking_status, input.booking_status));
    }

    // Date range filtering using booking_date
    if (input?.date_from !== undefined) {
      conditions.push(gte(bookingsTable.booking_date, input.date_from));
    }

    if (input?.date_to !== undefined) {
      conditions.push(lte(bookingsTable.booking_date, input.date_to));
    }

    // Apply where clause if we have conditions and then order
    const finalQuery = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions)).orderBy(desc(bookingsTable.booking_date))
      : baseQuery.orderBy(desc(bookingsTable.booking_date));

    const results = await finalQuery.execute();

    // Return the booking data - no numeric conversions needed for this table
    return results;
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    throw error;
  }
}
