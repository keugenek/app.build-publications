import { db } from '../db';
import { bookingsTable, membersTable } from '../db/schema';
import { type Booking } from '../schema';
import { eq } from 'drizzle-orm';
import { asc } from 'drizzle-orm';

export async function getClassAttendance(classScheduleId: number): Promise<Booking[]> {
  try {
    // Query bookings for the specific class schedule with member information
    // Join with members table to get member details for ordering
    const results = await db.select()
      .from(bookingsTable)
      .innerJoin(membersTable, eq(bookingsTable.member_id, membersTable.id))
      .where(eq(bookingsTable.class_schedule_id, classScheduleId))
      .orderBy(asc(membersTable.last_name), asc(membersTable.first_name))
      .execute();

    // Map results to return Booking objects with proper date conversions
    return results.map(result => ({
      id: result.bookings.id,
      member_id: result.bookings.member_id,
      class_schedule_id: result.bookings.class_schedule_id,
      booking_status: result.bookings.booking_status,
      booking_date: result.bookings.booking_date,
      cancellation_date: result.bookings.cancellation_date,
      attendance_marked_at: result.bookings.attendance_marked_at,
      created_at: result.bookings.created_at,
      updated_at: result.bookings.updated_at
    }));
  } catch (error) {
    console.error('Failed to get class attendance:', error);
    throw error;
  }
}
