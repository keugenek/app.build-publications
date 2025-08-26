import { type CancelReservationInput, type Reservation } from '../schema';

import { db } from '../db';
import { eq } from 'drizzle-orm';
import { reservationsTable } from '../db/schema';

// Cancel a reservation by deleting it from the database and returning the deleted record
export const cancelReservation = async (input: CancelReservationInput): Promise<Reservation> => {
  try {
    const result = await db
      .delete(reservationsTable)
      .where(eq(reservationsTable.id, input.id))
      .returning()
      .execute();

    const deleted = result[0];
    if (!deleted) {
      throw new Error(`Reservation with id ${input.id} not found`);
    }
    return deleted as Reservation;
  } catch (error) {
    console.error('Failed to cancel reservation:', error);
    throw error;
  }
};


