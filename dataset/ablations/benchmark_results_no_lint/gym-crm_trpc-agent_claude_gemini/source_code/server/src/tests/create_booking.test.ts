import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, bookingsTable, instructorsTable } from '../db/schema';
import { type CreateBookingInput } from '../schema';
import { createBooking } from '../handlers/create_booking';
import { eq, and, count } from 'drizzle-orm';

describe('createBooking', () => {
  let testUserId: number;
  let testInstructorId: number;
  let testClassId: number;
  let testClassWithLimitId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'member'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create instructor user
    const instructorUserResult = await db.insert(usersTable)
      .values({
        name: 'Instructor User',
        email: 'instructor@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    // Create instructor
    const instructorResult = await db.insert(instructorsTable)
      .values({
        user_id: instructorUserResult[0].id,
        specialization: 'Yoga',
        bio: 'Experienced yoga instructor'
      })
      .returning()
      .execute();
    testInstructorId = instructorResult[0].id;

    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Yoga Class',
        description: 'A relaxing yoga session',
        start_time: new Date('2024-12-01T10:00:00Z'),
        end_time: new Date('2024-12-01T11:00:00Z'),
        instructor_id: testInstructorId,
        max_capacity: 10
      })
      .returning()
      .execute();
    testClassId = classResult[0].id;

    // Create class with limited capacity for waitlist testing
    const limitedClassResult = await db.insert(classesTable)
      .values({
        name: 'Limited Capacity Class',
        description: 'Class with only 1 spot',
        start_time: new Date('2024-12-02T10:00:00Z'),
        end_time: new Date('2024-12-02T11:00:00Z'),
        instructor_id: testInstructorId,
        max_capacity: 1
      })
      .returning()
      .execute();
    testClassWithLimitId = limitedClassResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateBookingInput = {
    user_id: 0, // Will be set in tests
    class_id: 0  // Will be set in tests
  };

  it('should create a confirmed booking when class has capacity', async () => {
    const input = { ...testInput, user_id: testUserId, class_id: testClassId };
    const result = await createBooking(input);

    // Verify booking details
    expect(result.user_id).toEqual(testUserId);
    expect(result.class_id).toEqual(testClassId);
    expect(result.booking_status).toEqual('confirmed');
    expect(result.id).toBeDefined();
    expect(result.booked_at).toBeInstanceOf(Date);
    expect(result.cancelled_at).toBeNull();
  });

  it('should save booking to database', async () => {
    const input = { ...testInput, user_id: testUserId, class_id: testClassId };
    const result = await createBooking(input);

    // Query database to verify booking was saved
    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, result.id))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].user_id).toEqual(testUserId);
    expect(bookings[0].class_id).toEqual(testClassId);
    expect(bookings[0].booking_status).toEqual('confirmed');
    expect(bookings[0].booked_at).toBeInstanceOf(Date);
  });

  it('should create waitlist booking when class is at capacity', async () => {
    // First, fill the class to capacity (1 spot)
    const firstUserResult = await db.insert(usersTable)
      .values({
        name: 'First User',
        email: 'first@example.com',
        role: 'member'
      })
      .returning()
      .execute();

    await db.insert(bookingsTable)
      .values({
        user_id: firstUserResult[0].id,
        class_id: testClassWithLimitId,
        booking_status: 'confirmed'
      })
      .execute();

    // Now try to book for test user - should go to waitlist
    const input = { ...testInput, user_id: testUserId, class_id: testClassWithLimitId };
    const result = await createBooking(input);

    expect(result.booking_status).toEqual('waitlist');
    expect(result.user_id).toEqual(testUserId);
    expect(result.class_id).toEqual(testClassWithLimitId);
  });

  it('should throw error when user does not exist', async () => {
    const input = { ...testInput, user_id: 99999, class_id: testClassId };
    
    await expect(createBooking(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when class does not exist', async () => {
    const input = { ...testInput, user_id: testUserId, class_id: 99999 };
    
    await expect(createBooking(input)).rejects.toThrow(/class not found/i);
  });

  it('should prevent duplicate confirmed bookings', async () => {
    const input = { ...testInput, user_id: testUserId, class_id: testClassId };
    
    // Create first booking
    await createBooking(input);

    // Try to create duplicate booking
    await expect(createBooking(input)).rejects.toThrow(/already has a confirmed booking/i);
  });

  it('should allow booking after cancelling previous booking', async () => {
    const input = { ...testInput, user_id: testUserId, class_id: testClassId };
    
    // Create first booking
    const firstBooking = await createBooking(input);

    // Cancel the first booking
    await db.update(bookingsTable)
      .set({ 
        booking_status: 'cancelled',
        cancelled_at: new Date()
      })
      .where(eq(bookingsTable.id, firstBooking.id))
      .execute();

    // Should be able to create new booking
    const secondBooking = await createBooking(input);
    
    expect(secondBooking.booking_status).toEqual('confirmed');
    expect(secondBooking.id).not.toEqual(firstBooking.id);
  });

  it('should correctly count only confirmed bookings for capacity check', async () => {
    // Create multiple users
    const users = [];
    for (let i = 0; i < 3; i++) {
      const userResult = await db.insert(usersTable)
        .values({
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          role: 'member'
        })
        .returning()
        .execute();
      users.push(userResult[0]);
    }

    // Fill class to capacity with confirmed bookings
    await db.insert(bookingsTable)
      .values({
        user_id: users[0].id,
        class_id: testClassWithLimitId,
        booking_status: 'confirmed'
      })
      .execute();

    // Add a cancelled booking (should not count towards capacity)
    await db.insert(bookingsTable)
      .values({
        user_id: users[1].id,
        class_id: testClassWithLimitId,
        booking_status: 'cancelled'
      })
      .execute();

    // New booking should go to waitlist since only confirmed count
    const input = { ...testInput, user_id: users[2].id, class_id: testClassWithLimitId };
    const result = await createBooking(input);

    expect(result.booking_status).toEqual('waitlist');
  });

  it('should handle capacity check correctly when multiple confirmed bookings exist', async () => {
    // Verify initial confirmed booking count is correct
    const [{ count: initialCount }] = await db.select({ count: count() })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.class_id, testClassId),
          eq(bookingsTable.booking_status, 'confirmed')
        )
      )
      .execute();

    expect(initialCount).toEqual(0);

    // Create booking when class has capacity (max 10)
    const input = { ...testInput, user_id: testUserId, class_id: testClassId };
    const result = await createBooking(input);

    expect(result.booking_status).toEqual('confirmed');

    // Verify count increased
    const [{ count: afterCount }] = await db.select({ count: count() })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.class_id, testClassId),
          eq(bookingsTable.booking_status, 'confirmed')
        )
      )
      .execute();

    expect(afterCount).toEqual(1);
  });
});
