import { db } from '../db';
import { bookingsTable, classesTable } from '../db/schema';
import { type UpdateBookingInput, type Booking } from '../schema';
import { eq, and, count } from 'drizzle-orm';

export const updateBooking = async (input: UpdateBookingInput): Promise<Booking> => {
  try {
    // First verify the booking exists
    const existingBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, input.id))
      .execute();

    if (existingBooking.length === 0) {
      throw new Error(`Booking with id ${input.id} not found`);
    }

    const booking = existingBooking[0];

    // Prepare update data
    const updateData: any = {};
    
    if (input.booking_status !== undefined) {
      updateData.booking_status = input.booking_status;
      
      // Set cancelled_at timestamp when status changes to cancelled
      if (input.booking_status === 'cancelled') {
        updateData.cancelled_at = new Date();
      } else if (input.booking_status === 'confirmed') {
        // Clear cancelled_at when confirming a previously cancelled booking
        updateData.cancelled_at = null;
      }
    }

    // Update the booking
    const updatedBooking = await db.update(bookingsTable)
      .set(updateData)
      .where(eq(bookingsTable.id, input.id))
      .returning()
      .execute();

    // Handle waitlist promotion if a confirmed booking was cancelled
    if (input.booking_status === 'cancelled' && booking.booking_status === 'confirmed') {
      await promoteFromWaitlist(booking.class_id);
    }

    return updatedBooking[0];
  } catch (error) {
    console.error('Booking update failed:', error);
    throw error;
  }
};

// Helper function to promote the next person from waitlist when a spot becomes available
const promoteFromWaitlist = async (classId: number): Promise<void> => {
  try {
    // Get class capacity
    const classInfo = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    if (classInfo.length === 0) {
      return; // Class not found, nothing to do
    }

    const maxCapacity = classInfo[0].max_capacity;

    // Count current confirmed bookings
    const confirmedCount = await db.select({ count: count() })
      .from(bookingsTable)
      .where(and(
        eq(bookingsTable.class_id, classId),
        eq(bookingsTable.booking_status, 'confirmed')
      ))
      .execute();

    const currentConfirmed = confirmedCount[0].count;

    // If there's now space available, promote the oldest waitlisted booking
    if (currentConfirmed < maxCapacity) {
      const waitlistBookings = await db.select()
        .from(bookingsTable)
        .where(and(
          eq(bookingsTable.class_id, classId),
          eq(bookingsTable.booking_status, 'waitlist')
        ))
        .orderBy(bookingsTable.booked_at) // Oldest first (FIFO)
        .limit(1)
        .execute();

      if (waitlistBookings.length > 0) {
        await db.update(bookingsTable)
          .set({
            booking_status: 'confirmed',
            cancelled_at: null
          })
          .where(eq(bookingsTable.id, waitlistBookings[0].id))
          .execute();
      }
    }
  } catch (error) {
    console.error('Waitlist promotion failed:', error);
    // Don't throw here to avoid breaking the main update operation
  }
};
