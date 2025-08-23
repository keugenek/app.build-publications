import { type MarkAttendanceInput, type Reservation } from '../schema';
import { db } from '../db';
import { reservationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Marks attendance for a reservation by updating the `attended` column.
 * Throws an error if the reservation does not exist.
 */
export const markAttendance = async (input: MarkAttendanceInput): Promise<Reservation> => {
  try {
    const result = await db
      .update(reservationsTable)
      .set({ attended: input.attended })
      .where(eq(reservationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Reservation with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Failed to mark attendance:', error);
    throw error;
  }
};
