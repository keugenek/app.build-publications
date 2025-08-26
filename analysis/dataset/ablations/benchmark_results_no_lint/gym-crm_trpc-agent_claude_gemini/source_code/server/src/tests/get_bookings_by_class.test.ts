import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable, classesTable, bookingsTable } from '../db/schema';
import { type GetBookingsByClassInput } from '../schema';
import { getBookingsByClass } from '../handlers/get_bookings_by_class';

// Test data
const testUser = {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'member' as const
};

const testUser2 = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  role: 'member' as const
};

const testInstructorUser = {
  name: 'Mike Instructor',
  email: 'mike@example.com',
  role: 'instructor' as const
};

const testInput: GetBookingsByClassInput = {
  class_id: 1
};

describe('getBookingsByClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return bookings for a specific class', async () => {
    // Create prerequisite data
    const [user1] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values(testUser2)
      .returning()
      .execute();

    const [instructorUser] = await db.insert(usersTable)
      .values(testInstructorUser)
      .returning()
      .execute();

    const [instructor] = await db.insert(instructorsTable)
      .values({
        user_id: instructorUser.id,
        specialization: 'Yoga',
        bio: 'Experienced yoga instructor'
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'A peaceful yoga session',
        start_time: new Date('2024-01-15T09:00:00Z'),
        end_time: new Date('2024-01-15T10:00:00Z'),
        instructor_id: instructor.id,
        max_capacity: 10
      })
      .returning()
      .execute();

    // Create bookings for this class
    const [booking1] = await db.insert(bookingsTable)
      .values({
        user_id: user1.id,
        class_id: testClass.id,
        booking_status: 'confirmed'
      })
      .returning()
      .execute();

    const [booking2] = await db.insert(bookingsTable)
      .values({
        user_id: user2.id,
        class_id: testClass.id,
        booking_status: 'waitlist'
      })
      .returning()
      .execute();

    // Test the handler
    const result = await getBookingsByClass({ class_id: testClass.id });

    expect(result).toHaveLength(2);
    
    // Check first booking
    const firstBooking = result.find(b => b.id === booking1.id);
    expect(firstBooking).toBeDefined();
    expect(firstBooking!.user_id).toBe(user1.id);
    expect(firstBooking!.class_id).toBe(testClass.id);
    expect(firstBooking!.booking_status).toBe('confirmed');
    expect(firstBooking!.booked_at).toBeInstanceOf(Date);
    expect(firstBooking!.cancelled_at).toBeNull();

    // Check second booking
    const secondBooking = result.find(b => b.id === booking2.id);
    expect(secondBooking).toBeDefined();
    expect(secondBooking!.user_id).toBe(user2.id);
    expect(secondBooking!.class_id).toBe(testClass.id);
    expect(secondBooking!.booking_status).toBe('waitlist');
    expect(secondBooking!.booked_at).toBeInstanceOf(Date);
    expect(secondBooking!.cancelled_at).toBeNull();
  });

  it('should return empty array when class has no bookings', async () => {
    // Create prerequisite data but no bookings
    const [instructorUser] = await db.insert(usersTable)
      .values(testInstructorUser)
      .returning()
      .execute();

    const [instructor] = await db.insert(instructorsTable)
      .values({
        user_id: instructorUser.id,
        specialization: 'Pilates',
        bio: 'Professional pilates instructor'
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Empty Class',
        description: 'A class with no bookings',
        start_time: new Date('2024-01-20T14:00:00Z'),
        end_time: new Date('2024-01-20T15:00:00Z'),
        instructor_id: instructor.id,
        max_capacity: 5
      })
      .returning()
      .execute();

    const result = await getBookingsByClass({ class_id: testClass.id });

    expect(result).toHaveLength(0);
  });

  it('should return bookings with different statuses correctly', async () => {
    // Create prerequisite data
    const [user1] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values(testUser2)
      .returning()
      .execute();

    const [instructorUser] = await db.insert(usersTable)
      .values(testInstructorUser)
      .returning()
      .execute();

    const [instructor] = await db.insert(instructorsTable)
      .values({
        user_id: instructorUser.id,
        specialization: 'CrossFit',
        bio: 'High intensity trainer'
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'CrossFit Class',
        description: 'High intensity workout',
        start_time: new Date('2024-01-25T18:00:00Z'),
        end_time: new Date('2024-01-25T19:00:00Z'),
        instructor_id: instructor.id,
        max_capacity: 8
      })
      .returning()
      .execute();

    const cancelledDate = new Date('2024-01-10T12:00:00Z');

    // Create bookings with different statuses
    await db.insert(bookingsTable)
      .values([
        {
          user_id: user1.id,
          class_id: testClass.id,
          booking_status: 'confirmed'
        },
        {
          user_id: user2.id,
          class_id: testClass.id,
          booking_status: 'cancelled',
          cancelled_at: cancelledDate
        }
      ])
      .execute();

    const result = await getBookingsByClass({ class_id: testClass.id });

    expect(result).toHaveLength(2);
    
    const confirmedBooking = result.find(b => b.booking_status === 'confirmed');
    expect(confirmedBooking).toBeDefined();
    expect(confirmedBooking!.cancelled_at).toBeNull();

    const cancelledBooking = result.find(b => b.booking_status === 'cancelled');
    expect(cancelledBooking).toBeDefined();
    expect(cancelledBooking!.cancelled_at).toEqual(cancelledDate);
  });

  it('should only return bookings for the specified class', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [instructorUser] = await db.insert(usersTable)
      .values(testInstructorUser)
      .returning()
      .execute();

    const [instructor] = await db.insert(instructorsTable)
      .values({
        user_id: instructorUser.id,
        specialization: 'Multi-discipline',
        bio: 'Versatile instructor'
      })
      .returning()
      .execute();

    // Create two classes
    const [class1] = await db.insert(classesTable)
      .values({
        name: 'Class 1',
        description: 'First class',
        start_time: new Date('2024-01-30T10:00:00Z'),
        end_time: new Date('2024-01-30T11:00:00Z'),
        instructor_id: instructor.id,
        max_capacity: 10
      })
      .returning()
      .execute();

    const [class2] = await db.insert(classesTable)
      .values({
        name: 'Class 2',
        description: 'Second class',
        start_time: new Date('2024-01-30T15:00:00Z'),
        end_time: new Date('2024-01-30T16:00:00Z'),
        instructor_id: instructor.id,
        max_capacity: 10
      })
      .returning()
      .execute();

    // Create bookings for both classes
    await db.insert(bookingsTable)
      .values([
        {
          user_id: user.id,
          class_id: class1.id,
          booking_status: 'confirmed'
        },
        {
          user_id: user.id,
          class_id: class2.id,
          booking_status: 'confirmed'
        }
      ])
      .execute();

    // Test that only bookings for class1 are returned
    const result = await getBookingsByClass({ class_id: class1.id });

    expect(result).toHaveLength(1);
    expect(result[0].class_id).toBe(class1.id);
  });
});
