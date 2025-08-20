import { db } from '../db';
import { bookingsTable, classSchedulesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function cancelBooking(bookingId: number): Promise<{ success: boolean }> {
  try {
    // First, get the booking details with class schedule info
    const bookingResult = await db.select({
      booking: bookingsTable,
      schedule: classSchedulesTable
    })
      .from(bookingsTable)
      .innerJoin(
        classSchedulesTable, 
        eq(bookingsTable.class_schedule_id, classSchedulesTable.id)
      )
      .where(eq(bookingsTable.id, bookingId))
      .execute();

    if (bookingResult.length === 0) {
      throw new Error('Booking not found');
    }

    const { booking, schedule } = bookingResult[0];

    // Check if booking is already cancelled
    if (booking.booking_status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }

    // Check if the class is in the future (compare scheduled date with today)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const scheduledDate = new Date(schedule.scheduled_date);
    scheduledDate.setHours(0, 0, 0, 0); // Start of scheduled day

    if (scheduledDate < today) {
      throw new Error('Cannot cancel bookings for past classes');
    }

    // Update booking status and set cancellation date
    const cancellationDate = new Date();
    await db.update(bookingsTable)
      .set({
        booking_status: 'cancelled',
        cancellation_date: cancellationDate,
        updated_at: cancellationDate
      })
      .where(eq(bookingsTable.id, bookingId))
      .execute();

    // Decrement current_bookings count on the class schedule
    await db.update(classSchedulesTable)
      .set({
        current_bookings: schedule.current_bookings - 1,
        updated_at: cancellationDate
      })
      .where(eq(classSchedulesTable.id, schedule.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Booking cancellation failed:', error);
    throw error;
  }
}
