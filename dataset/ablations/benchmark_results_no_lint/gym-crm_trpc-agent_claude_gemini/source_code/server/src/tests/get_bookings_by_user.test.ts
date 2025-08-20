import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable, classesTable, bookingsTable } from '../db/schema';
import { type GetBookingsByUserInput } from '../schema';
import { getBookingsByUser } from '../handlers/get_bookings_by_user';
import { eq } from 'drizzle-orm';

describe('getBookingsByUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all bookings for a specific user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'member'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create instructor user
    const instructorUserResult = await db.insert(usersTable)
      .values({
        name: 'Test Instructor',
        email: 'instructor@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();
    const instructorUser = instructorUserResult[0];

    // Create instructor
    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: instructorUser.id,
        specialization: 'Yoga',
        bio: 'Experienced yoga instructor'
      })
      .returning()
      .execute();
    const instructor = instructorResult[0];

    // Create test classes
    const class1Result = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'Relaxing morning yoga session',
        start_time: new Date('2024-01-15 09:00:00'),
        end_time: new Date('2024-01-15 10:00:00'),
        instructor_id: instructor.id,
        max_capacity: 20
      })
      .returning()
      .execute();
    const class1 = class1Result[0];

    const class2Result = await db.insert(classesTable)
      .values({
        name: 'Evening Pilates',
        description: 'Strength building pilates',
        start_time: new Date('2024-01-15 18:00:00'),
        end_time: new Date('2024-01-15 19:00:00'),
        instructor_id: instructor.id,
        max_capacity: 15
      })
      .returning()
      .execute();
    const class2 = class2Result[0];

    // Create bookings for the user
    const booking1Result = await db.insert(bookingsTable)
      .values({
        user_id: user.id,
        class_id: class1.id,
        booking_status: 'confirmed'
      })
      .returning()
      .execute();
    const booking1 = booking1Result[0];

    const booking2Result = await db.insert(bookingsTable)
      .values({
        user_id: user.id,
        class_id: class2.id,
        booking_status: 'waitlist'
      })
      .returning()
      .execute();
    const booking2 = booking2Result[0];

    // Test the handler
    const input: GetBookingsByUserInput = { user_id: user.id };
    const result = await getBookingsByUser(input);

    // Validate results
    expect(result).toHaveLength(2);
    
    // Check first booking
    const resultBooking1 = result.find(b => b.id === booking1.id);
    expect(resultBooking1).toBeDefined();
    expect(resultBooking1!.user_id).toEqual(user.id);
    expect(resultBooking1!.class_id).toEqual(class1.id);
    expect(resultBooking1!.booking_status).toEqual('confirmed');
    expect(resultBooking1!.booked_at).toBeInstanceOf(Date);
    expect(resultBooking1!.cancelled_at).toBeNull();

    // Check second booking
    const resultBooking2 = result.find(b => b.id === booking2.id);
    expect(resultBooking2).toBeDefined();
    expect(resultBooking2!.user_id).toEqual(user.id);
    expect(resultBooking2!.class_id).toEqual(class2.id);
    expect(resultBooking2!.booking_status).toEqual('waitlist');
    expect(resultBooking2!.booked_at).toBeInstanceOf(Date);
    expect(resultBooking2!.cancelled_at).toBeNull();
  });

  it('should return empty array when user has no bookings', async () => {
    // Create test user with no bookings
    const userResult = await db.insert(usersTable)
      .values({
        name: 'User With No Bookings',
        email: 'nobookings@example.com',
        role: 'member'
      })
      .returning()
      .execute();
    const user = userResult[0];

    const input: GetBookingsByUserInput = { user_id: user.id };
    const result = await getBookingsByUser(input);

    expect(result).toHaveLength(0);
  });

  it('should only return bookings for the specified user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        name: 'User One',
        email: 'user1@example.com',
        role: 'member'
      })
      .returning()
      .execute();
    const user1 = user1Result[0];

    const user2Result = await db.insert(usersTable)
      .values({
        name: 'User Two',
        email: 'user2@example.com',
        role: 'member'
      })
      .returning()
      .execute();
    const user2 = user2Result[0];

    // Create instructor user
    const instructorUserResult = await db.insert(usersTable)
      .values({
        name: 'Test Instructor',
        email: 'instructor@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();
    const instructorUser = instructorUserResult[0];

    // Create instructor
    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: instructorUser.id,
        specialization: 'Fitness',
        bio: 'Personal trainer'
      })
      .returning()
      .execute();
    const instructor = instructorResult[0];

    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Fitness Class',
        description: 'High intensity workout',
        start_time: new Date('2024-01-16 10:00:00'),
        end_time: new Date('2024-01-16 11:00:00'),
        instructor_id: instructor.id,
        max_capacity: 25
      })
      .returning()
      .execute();
    const testClass = classResult[0];

    // Create bookings for both users
    await db.insert(bookingsTable)
      .values({
        user_id: user1.id,
        class_id: testClass.id,
        booking_status: 'confirmed'
      })
      .execute();

    await db.insert(bookingsTable)
      .values({
        user_id: user2.id,
        class_id: testClass.id,
        booking_status: 'confirmed'
      })
      .execute();

    // Test that only user1's bookings are returned
    const input: GetBookingsByUserInput = { user_id: user1.id };
    const result = await getBookingsByUser(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1.id);
    expect(result[0].class_id).toEqual(testClass.id);
  });

  it('should handle cancelled bookings correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'member'
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create instructor user
    const instructorUserResult = await db.insert(usersTable)
      .values({
        name: 'Test Instructor',
        email: 'instructor@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();
    const instructorUser = instructorUserResult[0];

    // Create instructor
    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: instructorUser.id,
        specialization: 'Dance',
        bio: 'Professional dancer'
      })
      .returning()
      .execute();
    const instructor = instructorResult[0];

    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Dance Class',
        description: 'Learn to dance',
        start_time: new Date('2024-01-17 14:00:00'),
        end_time: new Date('2024-01-17 15:00:00'),
        instructor_id: instructor.id,
        max_capacity: 30
      })
      .returning()
      .execute();
    const testClass = classResult[0];

    // Create cancelled booking
    const cancelledDate = new Date('2024-01-10 12:00:00');
    const bookingResult = await db.insert(bookingsTable)
      .values({
        user_id: user.id,
        class_id: testClass.id,
        booking_status: 'cancelled',
        cancelled_at: cancelledDate
      })
      .returning()
      .execute();
    const booking = bookingResult[0];

    const input: GetBookingsByUserInput = { user_id: user.id };
    const result = await getBookingsByUser(input);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(booking.id);
    expect(result[0].booking_status).toEqual('cancelled');
    expect(result[0].cancelled_at).toEqual(cancelledDate);
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetBookingsByUserInput = { user_id: 999999 };
    const result = await getBookingsByUser(input);

    expect(result).toHaveLength(0);
  });
});
