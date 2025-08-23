import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { classesTable, membersTable, reservationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CancelReservationInput } from '../schema';
import { cancelReservation } from '../handlers/cancel_reservation';

// Helper to create a class and a member, returning their IDs
async function createClassAndMember() {
  const classResult = await db
    .insert(classesTable)
    .values({
      name: 'Yoga',
      description: 'Morning yoga class',
      capacity: 20,
      instructor: 'Alice',
      scheduled_at: new Date(),
    })
    .returning()
    .execute();

  const memberResult = await db
    .insert(membersTable)
    .values({ name: 'John Doe', email: `john${Date.now()}@example.com` })
    .returning()
    .execute();

  return { classId: classResult[0].id, memberId: memberResult[0].id };
}

describe('cancelReservation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a reservation and return the deleted record', async () => {
    const { classId, memberId } = await createClassAndMember();

    // Create a reservation first
    const reservationInsert = await db
      .insert(reservationsTable)
      .values({ class_id: classId, member_id: memberId })
      .returning()
      .execute();
    const reservation = reservationInsert[0];

    const input: CancelReservationInput = { id: reservation.id };
    const deleted = await cancelReservation(input);

    // Verify returned reservation matches the inserted one
    expect(deleted.id).toBe(reservation.id);
    expect(deleted.class_id).toBe(classId);
    expect(deleted.member_id).toBe(memberId);
    expect(deleted.created_at).toBeInstanceOf(Date);

    // Ensure reservation no longer exists in the DB
    const stillExists = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, reservation.id))
      .execute();
    expect(stillExists).toHaveLength(0);
  });

  it('should throw an error when the reservation does not exist', async () => {
    const input: CancelReservationInput = { id: 9999 };
    await expect(cancelReservation(input)).rejects.toThrow(/not found/i);
  });
});
