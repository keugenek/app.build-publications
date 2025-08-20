import { db } from '../db';
import { bookingsTable, classesTable, membersTable } from '../db/schema';
import { type CreateBookingInput, type Booking } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createBooking = async (input: CreateBookingInput): Promise<Booking> => {
  try {
    // First, verify that the member exists
    const member = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, input.member_id))
      .limit(1)
      .execute();

    if (member.length === 0) {
      throw new Error(`Member with ID ${input.member_id} not found`);
    }

    // Verify that the class exists and get its details
    const classInfo = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .limit(1)
      .execute();

    if (classInfo.length === 0) {
      throw new Error(`Class with ID ${input.class_id} not found`);
    }

    const classData = classInfo[0];

    // Check if the class has available spots
    if (classData.current_bookings >= classData.max_capacity) {
      throw new Error('Class is at full capacity');
    }

    // Check if the class is in a bookable state
    if (classData.status === 'completed' || classData.status === 'cancelled') {
      throw new Error('Cannot book a class that is completed or cancelled');
    }

    // Check if member already has a booking for this class
    const existingBooking = await db.select()
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.member_id, input.member_id),
          eq(bookingsTable.class_id, input.class_id)
        )
      )
      .limit(1)
      .execute();

    if (existingBooking.length > 0) {
      throw new Error('Member already has a booking for this class');
    }

    // Create the booking
    const bookingResult = await db.insert(bookingsTable)
      .values({
        member_id: input.member_id,
        class_id: input.class_id,
        status: input.status,
        booked_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    const booking = bookingResult[0];

    // Increment the current_bookings count for the class
    await db.update(classesTable)
      .set({
        current_bookings: classData.current_bookings + 1,
        updated_at: new Date()
      })
      .where(eq(classesTable.id, input.class_id))
      .execute();

    return booking;
  } catch (error) {
    console.error('Booking creation failed:', error);
    throw error;
  }
};
