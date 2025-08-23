import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reservationsTable, membersTable, classesTable } from '../db/schema';
import { type CreateReservationInput, type CreateMemberInput, type CreateClassInput } from '../schema';
import { createReservation } from '../handlers/create_reservation';
import { eq } from 'drizzle-orm';

// Helper function to create a member
const createMember = async (input: CreateMemberInput) => {
  const result = await db.insert(membersTable)
    .values({
      name: input.name,
      email: input.email
    })
    .returning()
    .execute();
  return result[0];
};

// Helper function to create a class
const createClass = async (input: CreateClassInput) => {
  const result = await db.insert(classesTable)
    .values({
      name: input.name,
      description: input.description,
      instructor: input.instructor,
      date: input.date,
      time: input.time,
      capacity: input.capacity
    })
    .returning()
    .execute();
  return result[0];
};

describe('createReservation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a reservation', async () => {
    // First create a member and a class for the reservation
    const member = await createMember({
      name: 'John Doe',
      email: 'john@example.com'
    });

    const fitnessClass = await createClass({
      name: 'Yoga Class',
      description: 'Relaxing yoga session',
      instructor: 'Jane Smith',
      date: new Date('2023-12-01T10:00:00Z'),
      time: '10:00 AM',
      capacity: 20
    });

    const testInput: CreateReservationInput = {
      memberId: member.id,
      classId: fitnessClass.id
    };

    const result = await createReservation(testInput);

    // Basic field validation
    expect(result.memberId).toEqual(member.id);
    expect(result.classId).toEqual(fitnessClass.id);
    expect(result.id).toBeDefined();
    expect(result.reservedAt).toBeInstanceOf(Date);
  });

  it('should save reservation to database', async () => {
    // First create a member and a class for the reservation
    const member = await createMember({
      name: 'John Doe',
      email: 'john@example.com'
    });

    const fitnessClass = await createClass({
      name: 'Yoga Class',
      description: 'Relaxing yoga session',
      instructor: 'Jane Smith',
      date: new Date('2023-12-01T10:00:00Z'),
      time: '10:00 AM',
      capacity: 20
    });

    const testInput: CreateReservationInput = {
      memberId: member.id,
      classId: fitnessClass.id
    };

    const result = await createReservation(testInput);

    // Query using proper drizzle syntax
    const reservations = await db.select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, result.id))
      .execute();

    expect(reservations).toHaveLength(1);
    expect(reservations[0].memberId).toEqual(member.id);
    expect(reservations[0].classId).toEqual(fitnessClass.id);
    expect(reservations[0].reservedAt).toBeInstanceOf(Date);
  });
});
