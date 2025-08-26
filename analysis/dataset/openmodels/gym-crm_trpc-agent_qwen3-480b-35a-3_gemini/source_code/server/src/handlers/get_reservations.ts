import { db } from '../db';
import { reservationsTable } from '../db/schema';
import { type Reservation } from '../schema';
import { eq } from 'drizzle-orm';

export const getReservations = async (): Promise<Reservation[]> => {
  try {
    const results = await db.select()
      .from(reservationsTable)
      .execute();

    // Convert date fields to Date objects
    return results.map(reservation => ({
      ...reservation,
      reserved_at: new Date(reservation.reserved_at),
      cancelled_at: reservation.cancelled_at ? new Date(reservation.cancelled_at) : null
    }));
  } catch (error) {
    console.error('Failed to fetch reservations:', error);
    throw error;
  }
};

export const getClassReservations = async (classId: number): Promise<Reservation[]> => {
  try {
    const results = await db.select()
      .from(reservationsTable)
      .where(eq(reservationsTable.class_id, classId))
      .execute();

    // Convert date fields to Date objects
    return results.map(reservation => ({
      ...reservation,
      reserved_at: new Date(reservation.reserved_at),
      cancelled_at: reservation.cancelled_at ? new Date(reservation.cancelled_at) : null
    }));
  } catch (error) {
    console.error(`Failed to fetch reservations for class ${classId}:`, error);
    throw error;
  }
};

export const getMemberReservations = async (memberId: number): Promise<Reservation[]> => {
  try {
    const results = await db.select()
      .from(reservationsTable)
      .where(eq(reservationsTable.member_id, memberId))
      .execute();

    // Convert date fields to Date objects
    return results.map(reservation => ({
      ...reservation,
      reserved_at: new Date(reservation.reserved_at),
      cancelled_at: reservation.cancelled_at ? new Date(reservation.cancelled_at) : null
    }));
  } catch (error) {
    console.error(`Failed to fetch reservations for member ${memberId}:`, error);
    throw error;
  }
};
