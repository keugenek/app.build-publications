import { db } from '../db';
import { bookingsTable } from '../db/schema';
import { type Booking } from '../schema';
import { eq } from 'drizzle-orm';

export const cancelBooking = async (bookingId: number): Promise<Booking> => {
  try {
    // First, verify the booking exists and get its current status
    const existingBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .execute();

    if (existingBooking.length === 0) {
      throw new Error(`Booking with id ${bookingId} not found`);
    }

    const booking = existingBooking[0];

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }

    // Check if booking can be cancelled (not already attended or no-show)
    if (booking.status === 'attended' || booking.status === 'no_show') {
      throw new Error(`Cannot cancel booking with status: ${booking.status}`);
    }

    // Update booking status to cancelled
    const result = await db.update(bookingsTable)
      .set({
        status: 'cancelled',
        updated_at: new Date()
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Booking cancellation failed:', error);
    throw error;
  }
};
