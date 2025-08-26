import { db } from '../db';
import { bookingsTable, classesTable, instructorsTable, usersTable } from '../db/schema';
import { type GetBookingsByUserInput, type Booking } from '../schema';
import { eq } from 'drizzle-orm';

export const getBookingsByUser = async (input: GetBookingsByUserInput): Promise<Booking[]> => {
  try {
    // Fetch bookings with class details and instructor information
    const results = await db.select()
      .from(bookingsTable)
      .innerJoin(classesTable, eq(bookingsTable.class_id, classesTable.id))
      .innerJoin(instructorsTable, eq(classesTable.instructor_id, instructorsTable.id))
      .innerJoin(usersTable, eq(instructorsTable.user_id, usersTable.id))
      .where(eq(bookingsTable.user_id, input.user_id))
      .execute();

    // Transform the joined results back to Booking objects
    // Note: After joins, data is nested in result object
    return results.map(result => ({
      id: result.bookings.id,
      user_id: result.bookings.user_id,
      class_id: result.bookings.class_id,
      booking_status: result.bookings.booking_status,
      booked_at: result.bookings.booked_at,
      cancelled_at: result.bookings.cancelled_at
    }));
  } catch (error) {
    console.error('Failed to fetch bookings by user:', error);
    throw error;
  }
};
