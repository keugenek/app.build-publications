import { db } from '../db';
import { bookingsTable, classesTable, usersTable } from '../db/schema';
import { type CreateBookingInput, type Booking } from '../schema';
import { eq, and, count } from 'drizzle-orm';

export const createBooking = async (input: CreateBookingInput): Promise<Booking> => {
  try {
    // First, verify the user exists
    const userExists = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error('User not found');
    }

    // Get class details and verify it exists
    const classDetails = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .execute();

    if (classDetails.length === 0) {
      throw new Error('Class not found');
    }

    const targetClass = classDetails[0];

    // Check for existing booking (prevent duplicates)
    const existingBooking = await db.select()
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.user_id, input.user_id),
          eq(bookingsTable.class_id, input.class_id),
          eq(bookingsTable.booking_status, 'confirmed')
        )
      )
      .execute();

    if (existingBooking.length > 0) {
      throw new Error('User already has a confirmed booking for this class');
    }

    // Check current confirmed bookings count for capacity
    const [{ count: confirmedCount }] = await db.select({ count: count() })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.class_id, input.class_id),
          eq(bookingsTable.booking_status, 'confirmed')
        )
      )
      .execute();

    // Determine booking status based on capacity
    const bookingStatus = confirmedCount >= targetClass.max_capacity ? 'waitlist' : 'confirmed';

    // Create the booking
    const result = await db.insert(bookingsTable)
      .values({
        user_id: input.user_id,
        class_id: input.class_id,
        booking_status: bookingStatus
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Booking creation failed:', error);
    throw error;
  }
};
