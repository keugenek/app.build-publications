import { db } from '../db';
import { bookingsTable, usersTable } from '../db/schema';
import { type GetBookingsByClassInput, type Booking } from '../schema';
import { eq } from 'drizzle-orm';

export async function getBookingsByClass(input: GetBookingsByClassInput): Promise<Booking[]> {
  try {
    // Query bookings with user details for the specified class
    const results = await db.select()
      .from(bookingsTable)
      .innerJoin(usersTable, eq(bookingsTable.user_id, usersTable.id))
      .where(eq(bookingsTable.class_id, input.class_id))
      .execute();

    // Map results to Booking objects with proper structure
    return results.map(result => ({
      id: result.bookings.id,
      user_id: result.bookings.user_id,
      class_id: result.bookings.class_id,
      booking_status: result.bookings.booking_status,
      booked_at: result.bookings.booked_at,
      cancelled_at: result.bookings.cancelled_at
    }));
  } catch (error) {
    console.error('Failed to get bookings by class:', error);
    throw error;
  }
}
