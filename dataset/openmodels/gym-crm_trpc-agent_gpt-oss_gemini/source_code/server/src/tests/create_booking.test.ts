import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { classesTable, membersTable, bookingsTable } from '../db/schema';
import { type CreateBookingInput } from '../schema';
import { createBooking } from '../handlers/create_booking';

// Helper to create a class record directly in DB
const createTestClass = async () => {
  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
  const result = await db
    .insert(classesTable)
    .values({
      name: 'Yoga Session',
      description: 'A relaxing yoga class',
      start_time: now,
      end_time: later,
      capacity: 20,
    })
    .returning()
    .execute();
  return result[0];
};

// Helper to create a member record directly in DB
const createTestMember = async () => {
  const result = await db
    .insert(membersTable)
    .values({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: null,
    })
    .returning()
    .execute();
  return result[0];
};

describe('createBooking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a booking when class and member exist', async () => {
    const classRec = await createTestClass();
    const memberRec = await createTestMember();

    const input: CreateBookingInput = {
      class_id: classRec.id,
      member_id: memberRec.id,
    };

    const booking = await createBooking(input);

    // Validate returned fields
    expect(booking.id).toBeDefined();
    expect(booking.class_id).toBe(classRec.id);
    expect(booking.member_id).toBe(memberRec.id);
    expect(booking.status).toBe('booked');
    expect(booking.created_at).toBeInstanceOf(Date);

    // Verify persisted in DB
    const dbBooking = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, booking.id))
      .execute();
    expect(dbBooking).toHaveLength(1);
    expect(dbBooking[0].class_id).toBe(classRec.id);
    expect(dbBooking[0].member_id).toBe(memberRec.id);
    expect(dbBooking[0].status).toBe('booked');
  });

  it('should throw an error if the class does not exist', async () => {
    const memberRec = await createTestMember();
    const input: CreateBookingInput = {
      class_id: 9999, // non‑existent
      member_id: memberRec.id,
    };
    await expect(createBooking(input)).rejects.toThrow(/Class not found/i);
  });

  it('should throw an error if the member does not exist', async () => {
    const classRec = await createTestClass();
    const input: CreateBookingInput = {
      class_id: classRec.id,
      member_id: 9999, // non‑existent
    };
    await expect(createBooking(input)).rejects.toThrow(/Member not found/i);
  });
});
