import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, membersTable, bookingsTable } from '../db/schema';
import { type Booking } from '../schema';
import { getBookings } from '../handlers/get_bookings';

// Helper to create a class
const createTestClass = async () => {
  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
  const [cls] = await db
    .insert(classesTable)
    .values({
      name: 'Yoga Class',
      description: 'A test yoga class',
      start_time: now,
      end_time: later,
      capacity: 20,
    })
    .returning()
    .execute();
  return cls;
};

// Helper to create a member
const createTestMember = async () => {
  const [mem] = await db
    .insert(membersTable)
    .values({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: null,
    })
    .returning()
    .execute();
  return mem;
};

// Helper to create a booking linking class and member
const createTestBooking = async (classId: number, memberId: number) => {
  const [booking] = await db
    .insert(bookingsTable)
    .values({
      class_id: classId,
      member_id: memberId,
    })
    .returning()
    .execute();
  return booking;
};

describe('getBookings handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all bookings from the database', async () => {
    // Arrange: create prerequisite data
    const cls = await createTestClass();
    const mem = await createTestMember();
    const booking = await createTestBooking(cls.id, mem.id);

    // Act: call handler
    const result: Booking[] = await getBookings();

    // Assert: at least one booking returned and matches created one
    expect(result).toBeArray();
    expect(result.length).toBeGreaterThanOrEqual(1);

    const fetched = result.find(b => b.id === booking.id);
    expect(fetched).toBeDefined();
    if (fetched) {
      expect(fetched.class_id).toBe(cls.id);
      expect(fetched.member_id).toBe(mem.id);
      expect(fetched.status).toBe('booked');
      expect(fetched.created_at).toBeInstanceOf(Date);
    }
  });
});
