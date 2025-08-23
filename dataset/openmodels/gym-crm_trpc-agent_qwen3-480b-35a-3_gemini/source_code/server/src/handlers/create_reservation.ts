import { db } from '../db';
import { reservationsTable, classesTable, membersTable } from '../db/schema';
import { type CreateReservationInput, type Reservation } from '../schema';
import { eq } from 'drizzle-orm';

export const createReservation = async (input: CreateReservationInput): Promise<Reservation> => {
  try {
    // First, verify that the class exists
    const classExists = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .execute();
    
    if (classExists.length === 0) {
      throw new Error(`Class with id ${input.class_id} not found`);
    }

    // Then, verify that the member exists
    const memberExists = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, input.member_id))
      .execute();
    
    if (memberExists.length === 0) {
      throw new Error(`Member with id ${input.member_id} not found`);
    }

    // Insert reservation record
    const result = await db.insert(reservationsTable)
      .values({
        class_id: input.class_id,
        member_id: input.member_id,
        reserved_at: new Date(),
        cancelled_at: null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Reservation creation failed:', error);
    throw error;
  }
};
