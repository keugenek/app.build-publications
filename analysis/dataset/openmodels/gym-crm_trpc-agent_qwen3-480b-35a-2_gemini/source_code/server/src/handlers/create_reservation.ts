import { db } from '../db';
import { reservationsTable } from '../db/schema';
import { type CreateReservationInput, type Reservation } from '../schema';

export const createReservation = async (input: CreateReservationInput): Promise<Reservation> => {
  try {
    // Insert reservation record
    const result = await db.insert(reservationsTable)
      .values({
        memberId: input.memberId,
        classId: input.classId,
        reservedAt: new Date()
      })
      .returning()
      .execute();

    // Map the database result to the schema type
    const reservation = result[0];
    return {
      id: reservation.id,
      memberId: reservation.memberId,
      classId: reservation.classId,
      reservedAt: reservation.reservedAt
    };
  } catch (error) {
    console.error('Reservation creation failed:', error);
    throw error;
  }
};
