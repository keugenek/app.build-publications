import { db } from '../db';
import { bookingsTable, usersTable } from '../db/schema';
import { type GetClassAttendanceQuery, type Booking } from '../schema';
import { eq } from 'drizzle-orm';

export async function getClassAttendance(query: GetClassAttendanceQuery): Promise<Booking[]> {
  try {
    // Query bookings for the specific class schedule with user details
    const results = await db.select()
      .from(bookingsTable)
      .innerJoin(usersTable, eq(bookingsTable.user_id, usersTable.id))
      .where(eq(bookingsTable.class_schedule_id, query.class_schedule_id))
      .execute();

    // Transform the joined data back to Booking format with user details included
    return results.map(result => ({
      id: result.bookings.id,
      user_id: result.bookings.user_id,
      class_schedule_id: result.bookings.class_schedule_id,
      status: result.bookings.status,
      booked_at: result.bookings.booked_at,
      updated_at: result.bookings.updated_at,
      // Include user details for attendance marking
      user: {
        id: result.users.id,
        first_name: result.users.first_name,
        last_name: result.users.last_name,
        email: result.users.email,
        phone: result.users.phone
      }
    } as any)); // Cast to any since we're extending the Booking type with user details
  } catch (error) {
    console.error('Get class attendance failed:', error);
    throw error;
  }
}
