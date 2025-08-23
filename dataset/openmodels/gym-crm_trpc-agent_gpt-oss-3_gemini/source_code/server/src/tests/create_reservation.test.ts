import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { classesTable, membersTable, reservationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateReservationInput, type Reservation } from '../schema';
import { createReservation } from '../handlers/create_reservation';

// Helper to create a class record
const createTestClass = async () => {
  const [cls] = await db
    .insert(classesTable)
    .values({
      name: 'Yoga Basics',
      description: 'Introductory yoga class',
      capacity: 20,
      instructor: 'Alice',
      scheduled_at: new Date(),
    })
    .returning()
    .execute();
  return cls;
};

// Helper to create a member record
const createTestMember = async () => {
  const [mem] = await db
    .insert(membersTable)
    .values({
      name: 'John Doe',
      email: 'john.doe@example.com',
    })
    .returning()
    .execute();
  return mem;
};

describe('createReservation handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a reservation linking member and class', async () => {
    const cls = await createTestClass();
    const mem = await createTestMember();

    const input: CreateReservationInput = {
      class_id: cls.id,
      member_id: mem.id,
    };

    const reservation = await createReservation(input);

    // Validate returned reservation fields
    expect(reservation.id).toBeGreaterThan(0);
    expect(reservation.class_id).toEqual(cls.id);
    expect(reservation.member_id).toEqual(mem.id);
    expect(reservation.created_at).toBeInstanceOf(Date);

    // Verify reservation persisted in DB
    const dbReservation = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, reservation.id))
      .execute();

    expect(dbReservation).toHaveLength(1);
    expect(dbReservation[0].class_id).toEqual(cls.id);
    expect(dbReservation[0].member_id).toEqual(mem.id);
  });

  it('should throw when class does not exist', async () => {
    const mem = await createTestMember();
    const input: CreateReservationInput = {
      class_id: 9999, // non‑existent
      member_id: mem.id,
    };
    await expect(createReservation(input)).rejects.toThrow('Class with id 9999 does not exist');
  });

  it('should throw when member does not exist', async () => {
    const cls = await createTestClass();
    const input: CreateReservationInput = {
      class_id: cls.id,
      member_id: 9999, // non‑existent
    };
    await expect(createReservation(input)).rejects.toThrow('Member with id 9999 does not exist');
  });
});
