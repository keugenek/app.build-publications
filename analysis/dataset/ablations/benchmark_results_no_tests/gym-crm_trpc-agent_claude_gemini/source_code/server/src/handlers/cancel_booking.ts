import { db } from '../db';
import { bookingsTable, classesTable } from '../db/schema';
import { type Booking } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const cancelBooking = async (bookingId: number): Promise<Booking> => {
  try {
    // First, fetch the booking to validate it exists and check its current status
    const existingBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .execute();

    if (existingBookings.length === 0) {
      throw new Error('Booking not found');
    }

    const existingBooking = existingBookings[0];

    // Validate that the booking can be cancelled (not already attended)
    if (existingBooking.status === 'attended') {
      throw new Error('Cannot cancel a booking that has already been attended');
    }

    // If already cancelled, return the existing booking
    if (existingBooking.status === 'cancelled') {
      return existingBooking;
    }

    // Update the booking status to 'cancelled'
    const updatedBookings = await db.update(bookingsTable)
      .set({ 
        status: 'cancelled',
        updated_at: new Date()
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning()
      .execute();

    // Decrement the current_bookings count for the class
    // Only decrement if the booking was previously 'booked' or 'no_show'
    if (existingBooking.status === 'booked' || existingBooking.status === 'no_show') {
      await db.update(classesTable)
        .set({ 
          current_bookings: sql`${classesTable.current_bookings} - 1`,
          updated_at: new Date()
        })
        .where(eq(classesTable.id, existingBooking.class_id))
        .execute();
    }

    return updatedBookings[0];
  } catch (error) {
    console.error('Booking cancellation failed:', error);
    throw error;
  }
};
