import { db } from '../db';
import { eq } from 'drizzle-orm';
import { classesTable, membersTable, bookingsTable } from '../db/schema';
import { type CreateBookingInput, type Booking } from '../schema';

/**
 * Handler for creating a booking (member books a class).
 * Validates that both the class and member exist before inserting.
 */
export const createBooking = async (input: CreateBookingInput): Promise<Booking> => {
  try {
    // Verify class exists
    const classRecord = await db
      .select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .execute();
    if (classRecord.length === 0) {
      throw new Error('Class not found');
    }

    // Verify member exists
    const memberRecord = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.id, input.member_id))
      .execute();
    if (memberRecord.length === 0) {
      throw new Error('Member not found');
    }

    // Insert booking record; status defaults to 'booked'
    const result = await db
      .insert(bookingsTable)
      .values({
        class_id: input.class_id,
        member_id: input.member_id,
      })
      .returning()
      .execute();

    const booking = result[0];
    return booking;
  } catch (error) {
    console.error('Booking creation failed:', error);
    throw error;
  }
};
