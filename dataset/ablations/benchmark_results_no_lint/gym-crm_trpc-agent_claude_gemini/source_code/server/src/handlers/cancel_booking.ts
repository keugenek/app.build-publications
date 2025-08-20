import { db } from '../db';
import { bookingsTable } from '../db/schema';
import { type DeleteEntityInput, type Booking } from '../schema';
import { eq, and } from 'drizzle-orm';

export const cancelBooking = async (input: DeleteEntityInput): Promise<Booking> => {
  try {
    // First, get the current booking to validate it exists and is cancellable
    const existingBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, input.id))
      .execute();

    if (existingBookings.length === 0) {
      throw new Error(`Booking with id ${input.id} not found`);
    }

    const existingBooking = existingBookings[0];
    
    if (existingBooking.booking_status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }

    // Cancel the booking by updating status and cancelled_at timestamp
    const cancelledBookings = await db.update(bookingsTable)
      .set({
        booking_status: 'cancelled',
        cancelled_at: new Date()
      })
      .where(eq(bookingsTable.id, input.id))
      .returning()
      .execute();

    const cancelledBooking = cancelledBookings[0];

    // If a confirmed booking was cancelled, promote the first waitlisted member
    if (existingBooking.booking_status === 'confirmed') {
      // Find the first waitlisted booking for the same class, ordered by booked_at
      const waitlistedBookings = await db.select()
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.class_id, existingBooking.class_id),
            eq(bookingsTable.booking_status, 'waitlist')
          )
        )
        .orderBy(bookingsTable.booked_at)
        .limit(1)
        .execute();

      // Promote the first waitlisted member to confirmed
      if (waitlistedBookings.length > 0) {
        await db.update(bookingsTable)
          .set({
            booking_status: 'confirmed'
          })
          .where(eq(bookingsTable.id, waitlistedBookings[0].id))
          .execute();
      }
    }

    return cancelledBooking;
  } catch (error) {
    console.error('Booking cancellation failed:', error);
    throw error;
  }
};
