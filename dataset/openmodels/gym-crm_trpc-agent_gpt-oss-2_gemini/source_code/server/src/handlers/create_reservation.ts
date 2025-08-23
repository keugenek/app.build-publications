import { db } from '../db';
import { reservationsTable } from '../db/schema';
import { type CreateReservationInput, type Reservation } from '../schema';

/**
 * Creates a reservation linking a member to a class.
 * Ensures foreign key constraints are respected by the database.
 * Returns the newly created reservation record.
 */
export const createReservation = async (input: CreateReservationInput): Promise<Reservation> => {
  try {
    const result = await db
      .insert(reservationsTable)
      .values({
        class_id: input.class_id,
        member_id: input.member_id,
        // attended column defaults to NULL (null in JS) – omit to let DB set default
      })
      .returning()
      .execute();

    // The insertion returns an array with the inserted row
    const reservation = result[0];
    return reservation;
  } catch (error) {
    console.error('Failed to create reservation:', error);
    throw error;
  }
};
