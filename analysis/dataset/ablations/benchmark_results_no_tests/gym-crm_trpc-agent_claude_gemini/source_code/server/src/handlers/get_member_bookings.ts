import { db } from '../db';
import { bookingsTable, classesTable } from '../db/schema';
import { type MemberBookingView } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getMemberBookings(memberId: number): Promise<MemberBookingView[]> {
  try {
    // Join bookings with classes to get class details
    const results = await db.select()
      .from(bookingsTable)
      .innerJoin(classesTable, eq(bookingsTable.class_id, classesTable.id))
      .where(eq(bookingsTable.member_id, memberId))
      .orderBy(desc(bookingsTable.booked_at))
      .execute();

    // Transform joined results to match MemberBookingView schema
    return results.map(result => ({
      id: result.bookings.id,
      class_id: result.bookings.class_id,
      class_name: result.classes.name,
      instructor_name: result.classes.instructor_name,
      class_date: new Date(result.classes.class_date),
      start_time: result.classes.start_time,
      duration_minutes: result.classes.duration_minutes,
      status: result.bookings.status,
      booked_at: result.bookings.booked_at
    }));
  } catch (error) {
    console.error('Failed to get member bookings:', error);
    throw error;
  }
}
