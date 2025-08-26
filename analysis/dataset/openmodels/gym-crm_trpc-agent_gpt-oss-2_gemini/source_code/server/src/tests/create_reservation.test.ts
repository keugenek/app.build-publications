import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reservationsTable, classesTable, membersTable } from '../db/schema';
import { type CreateReservationInput } from '../schema';
import { createReservation } from '../handlers/create_reservation';
import { eq } from 'drizzle-orm';

// Helper to insert a class directly via DB
const createTestClass = async () => {
  const result = await db
    .insert(classesTable)
    .values([
      {
        name: 'Yoga Basics',
        description: 'Introductory yoga class',
        trainer: 'Alice',
        capacity: 20,
        date: '2024-01-01', // DATE stored as string in ISO format
        time: '09:00', // TIME column expects HH:MM string
      },
    ])
    .returning()
    .execute();
  return result[0];
};

// Helper to insert a member directly via DB
const createTestMember = async () => {
  const result = await db
    .insert(membersTable)
    .values([
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
      },
    ])
    .returning()
    .execute();
  return result[0];
};

describe('createReservation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a reservation and return it', async () => {
    const testClass = await createTestClass();
    const testMember = await createTestMember();

    const input: CreateReservationInput = {
      class_id: testClass.id,
      member_id: testMember.id,
    };

    const reservation = await createReservation(input);

    expect(reservation.id).toBeDefined();
    expect(reservation.class_id).toBe(testClass.id);
    expect(reservation.member_id).toBe(testMember.id);
    expect(reservation.attended).toBeNull();
  });

  it('should persist the reservation in the database', async () => {
    const testClass = await createTestClass();
    const testMember = await createTestMember();

    const input: CreateReservationInput = {
      class_id: testClass.id,
      member_id: testMember.id,
    };

    const reservation = await createReservation(input);

    const records = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, reservation.id))
      .execute();

    expect(records).toHaveLength(1);
    const dbReservation = records[0];
    expect(dbReservation.class_id).toBe(testClass.id);
    expect(dbReservation.member_id).toBe(testMember.id);
    expect(dbReservation.attended).toBeNull();
  });
});
