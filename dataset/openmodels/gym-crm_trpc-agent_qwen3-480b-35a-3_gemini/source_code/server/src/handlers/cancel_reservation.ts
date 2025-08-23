import { db } from '../db';
import { reservationsTable } from '../db/schema';
import { type CancelReservationInput, type Reservation } from '../schema';
import { eq } from 'drizzle-orm';

export const cancelReservation = async (input: CancelReservationInput): Promise<Reservation> => {
  try {
    // Update the reservation record to set cancelled_at to current timestamp
    const result = await db.update(reservationsTable)
      .set({
        cancelled_at: new Date()
      })
      .where(eq(reservationsTable.id, input.reservation_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Reservation with id ${input.reservation_id} not found`);
    }

    // Return the updated reservation
    return result[0];
  } catch (error) {
    console.error('Reservation cancellation failed:', error);
    throw error;
  }
};
