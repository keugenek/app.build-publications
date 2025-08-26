import { db } from '../db';
import { bookingsTable } from '../db/schema';
import { type UpdateBookingStatusInput, type Booking } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBookingStatus = async (input: UpdateBookingStatusInput): Promise<Booking> => {
  try {
    // Update booking status and updated_at timestamp
    const result = await db.update(bookingsTable)
      .set({
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(bookingsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Booking with id ${input.id} not found`);
    }

    // Return the updated booking
    const booking = result[0];
    return {
      ...booking
    };
  } catch (error) {
    console.error('Booking status update failed:', error);
    throw error;
  }
};
