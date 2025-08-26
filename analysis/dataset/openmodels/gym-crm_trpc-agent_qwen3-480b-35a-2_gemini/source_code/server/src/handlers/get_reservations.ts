import { db } from '../db';
import { reservationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Reservation } from '../schema';

export const getReservations = async (): Promise<Reservation[]> => {
  try {
    // Fetch all reservations from the database
    const reservations = await db.select()
      .from(reservationsTable)
      .execute();
    
    // Map the results to match the Reservation type
    return reservations.map(reservation => ({
      id: reservation.id,
      memberId: reservation.memberId,
      classId: reservation.classId,
      reservedAt: reservation.reservedAt
    }));
  } catch (error) {
    console.error('Failed to fetch reservations:', error);
    throw error;
  }
};
