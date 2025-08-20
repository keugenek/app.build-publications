import { db } from '../db';
import { bookingsTable, classSchedulesTable, classesTable } from '../db/schema';
import { type Booking } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getMemberBookings(memberId: number): Promise<Booking[]> {
  try {
    // Query bookings with class schedule and class information
    const results = await db.select()
      .from(bookingsTable)
      .innerJoin(
        classSchedulesTable, 
        eq(bookingsTable.class_schedule_id, classSchedulesTable.id)
      )
      .innerJoin(
        classesTable,
        eq(classSchedulesTable.class_id, classesTable.id)
      )
      .where(eq(bookingsTable.member_id, memberId))
      .orderBy(desc(classSchedulesTable.scheduled_date), desc(classSchedulesTable.start_time))
      .execute();

    // Transform the joined results back to Booking objects
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
    console.error('Failed to fetch member bookings:', error);
    throw error;
  }
}
