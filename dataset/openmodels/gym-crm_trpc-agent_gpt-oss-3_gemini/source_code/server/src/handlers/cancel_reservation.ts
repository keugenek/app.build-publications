// Cancel a reservation by ID and return the deleted reservation record
import { db } from '../db';
import { reservationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CancelReservationInput, type Reservation } from '../schema';

/**
 * Deletes a reservation record and returns the deleted data.
 * Throws an error if the reservation does not exist.
 */
export const cancelReservation = async (
  input: CancelReservationInput,
): Promise<Reservation> => {
  try {
    // Delete the reservation and return the deleted row
    const deleted = await db
      .delete(reservationsTable)
      .where(eq(reservationsTable.id, input.id))
      .returning()
      .execute();

    if (deleted.length === 0) {
      throw new Error(`Reservation with id ${input.id} not found`);
    }

    // Drizzle returns proper Date objects for timestamp columns
    return deleted[0];
  } catch (error) {
    console.error('Cancel reservation failed:', error);
    throw error;
  }
};
