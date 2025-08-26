import { db } from '../db';
import { reservationsTable, classesTable, membersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateReservationInput, type Reservation } from '../schema';

/**
 * Creates a reservation linking a member to a class.
 * Validates that both the class and member exist before insertion to avoid foreign key errors.
 */
export const createReservation = async (input: CreateReservationInput): Promise<Reservation> => {
  try {
    // Verify class exists
    const classExists = await db
      .select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .limit(1)
      .execute();
    if (classExists.length === 0) {
      throw new Error(`Class with id ${input.class_id} does not exist`);
    }

    // Verify member exists
    const memberExists = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.id, input.member_id))
      .limit(1)
      .execute();
    if (memberExists.length === 0) {
      throw new Error(`Member with id ${input.member_id} does not exist`);
    }

    // Insert reservation
    const result = await db
      .insert(reservationsTable)
      .values({
        class_id: input.class_id,
        member_id: input.member_id,
      })
      .returning()
      .execute();

    // The insert returns an array with a single reservation record
    const reservation = result[0];
    return reservation;
  } catch (error) {
    console.error('Failed to create reservation:', error);
    throw error;
  }
};
