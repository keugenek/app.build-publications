import { db } from '../db';
import { bookingsTable } from '../db/schema';
import { type UpdateBookingInput, type Booking } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateBookingStatus(input: UpdateBookingInput): Promise<Booking> {
  try {
    // Update the booking status with current timestamp
    const result = await db.update(bookingsTable)
      .set({ 
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(bookingsTable.id, input.id))
      .returning()
      .execute();

    // Check if booking was found and updated
    if (result.length === 0) {
      throw new Error(`Booking with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Booking status update failed:', error);
    throw error;
  }
}
