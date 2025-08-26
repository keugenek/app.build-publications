import { db } from '../db';
import { reservationsTable } from '../db/schema';
import { type Reservation } from '../schema';

/**
 * Fetch all reservations from the database.
 * Returns an array of {@link Reservation} objects.
 */
export const getReservations = async (): Promise<Reservation[]> => {
  try {
    const results = await db
      .select()
      .from(reservationsTable)
      .execute();
    // Drizzle returns rows with Date objects for timestamp columns, matching the Zod schema.
    return results as unknown as Reservation[];
  } catch (error) {
    console.error('Failed to fetch reservations:', error);
    throw error;
  }
};
