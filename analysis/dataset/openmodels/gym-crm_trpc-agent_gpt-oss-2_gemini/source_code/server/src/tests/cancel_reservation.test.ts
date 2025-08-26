import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { classesTable, membersTable, reservationsTable } from '../db/schema';
import { cancelReservation } from '../handlers/cancel_reservation';
import type { CancelReservationInput, Reservation } from '../schema';

// Helper to create a class record
async function createTestClass() {
  const [cls] = await db
    .insert(classesTable)
    .values({
      name: 'Yoga Basics',
      description: 'Introductory yoga class',
      trainer: 'Alice',
      capacity: 20,
      date: '2024-01-01',
      time: '10:00:00', // TIME column expects HH:MM:SS format
    })
    .returning()
    .execute();
  return cls;
}

// Helper to create a member record
async function createTestMember() {
  const [member] = await db
    .insert(membersTable)
    .values({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
    })
    .returning()
    .execute();
  return member;
}

// Helper to create a reservation record
async function createTestReservation(classId: number, memberId: number) {
  const [reservation] = await db
    .insert(reservationsTable)
    .values({
      class_id: classId,
      member_id: memberId,
    })
    .returning()
    .execute();
  return reservation;
}

describe('cancelReservation handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing reservation and return the deleted record', async () => {
    const cls = await createTestClass();
    const member = await createTestMember();
    const reservation = await createTestReservation(cls.id, member.id);

    const input: CancelReservationInput = { id: reservation.id };
    const deleted: Reservation = await cancelReservation(input);

    // Verify returned reservation matches the original
    expect(deleted.id).toBe(reservation.id);
    expect(deleted.class_id).toBe(cls.id);
    expect(deleted.member_id).toBe(member.id);
    expect(deleted.attended).toBeNull();

    // Verify reservation no longer exists in DB
    const remaining = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, reservation.id))
      .execute();

    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when attempting to cancel a non‑existent reservation', async () => {
    const input: CancelReservationInput = { id: 9999 };
    await expect(cancelReservation(input)).rejects.toThrow(/not found/i);
  });
});
