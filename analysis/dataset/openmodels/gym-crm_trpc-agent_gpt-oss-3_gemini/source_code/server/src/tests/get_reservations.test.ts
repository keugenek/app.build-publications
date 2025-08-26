import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { classesTable, membersTable, reservationsTable } from '../db/schema';
import { type Reservation, type CreateReservationInput, type CreateClassInput, type CreateMemberInput } from '../schema';

// Helper functions to create prerequisite data
const createClass = async (input: CreateClassInput) => {
  const [result] = await db.insert(classesTable).values({
    name: input.name,
    description: input.description,
    capacity: input.capacity,
    instructor: input.instructor,
    scheduled_at: input.scheduled_at,
  }).returning().execute();
  return result;
};

const createMember = async (input: CreateMemberInput) => {
  const [result] = await db.insert(membersTable).values({
    name: input.name,
    email: input.email,
  }).returning().execute();
  return result;
};

const createReservation = async (input: CreateReservationInput) => {
  const [result] = await db.insert(reservationsTable).values({
    class_id: input.class_id,
    member_id: input.member_id,
  }).returning().execute();
  return result;
};

describe('getReservations handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no reservations exist', async () => {
    const reservations = await import('../handlers/get_reservations').then(m => m.getReservations());
    expect(reservations).toBeInstanceOf(Array);
    expect(reservations).toHaveLength(0);
  });

  it('should fetch all reservations from the database', async () => {
    // Create class and member
    const classData = await createClass({
      name: 'Yoga Basics',
      description: null,
      capacity: 20,
      instructor: 'Alice',
      scheduled_at: new Date(),
    });
    const memberData = await createMember({
      name: 'Bob',
      email: 'bob@example.com',
    });
    // Create reservation
    const reservation = await createReservation({
      class_id: classData.id,
      member_id: memberData.id,
    });

    const reservations = await import('../handlers/get_reservations').then(m => m.getReservations());
    expect(reservations).toBeInstanceOf(Array);
    expect(reservations).toHaveLength(1);
    const fetched = reservations[0];
    expect(fetched.id).toBe(reservation.id);
    expect(fetched.class_id).toBe(classData.id);
    expect(fetched.member_id).toBe(memberData.id);
    expect(fetched.created_at).toBeInstanceOf(Date);
  });
});
