import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, classSchedulesTable, bookingsTable } from '../db/schema';
import { type CreateBookingInput } from '../schema';
import { createBooking } from '../handlers/create_booking';
import { eq, and, count } from 'drizzle-orm';

describe('createBooking', () => {
  let testUserId: number;
  let testClassId: number;
  let testScheduleId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'member',
        is_active: true
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;

    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Yoga Class',
        class_type: 'yoga',
        instructor_name: 'Jane Smith',
        max_capacity: 10,
        duration_minutes: 60,
        price: '25.00',
        is_active: true
      })
      .returning()
      .execute();
    
    testClassId = classResult[0].id;

    // Create test class schedule
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const endTime = new Date(tomorrow);
    endTime.setHours(11, 0, 0, 0);

    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: testClassId,
        start_time: tomorrow,
        end_time: endTime,
        room_name: 'Room A',
        is_cancelled: false
      })
      .returning()
      .execute();
    
    testScheduleId = scheduleResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateBookingInput = {
    user_id: 0, // Will be set in tests
    class_schedule_id: 0 // Will be set in tests
  };

  it('should create a booking successfully', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      class_schedule_id: testScheduleId
    };

    const result = await createBooking(input);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.class_schedule_id).toEqual(testScheduleId);
    expect(result.status).toEqual('confirmed');
    expect(result.booked_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save booking to database', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      class_schedule_id: testScheduleId
    };

    const result = await createBooking(input);

    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, result.id))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].user_id).toEqual(testUserId);
    expect(bookings[0].class_schedule_id).toEqual(testScheduleId);
    expect(bookings[0].status).toEqual('confirmed');
  });

  it('should reject booking for non-existent user', async () => {
    const input = {
      ...testInput,
      user_id: 99999,
      class_schedule_id: testScheduleId
    };

    await expect(createBooking(input)).rejects.toThrow(/user not found or inactive/i);
  });

  it('should reject booking for inactive user', async () => {
    // Create inactive user
    const inactiveUserResult = await db.insert(usersTable)
      .values({
        email: 'inactive@example.com',
        password_hash: 'hashed_password',
        first_name: 'Inactive',
        last_name: 'User',
        role: 'member',
        is_active: false
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      user_id: inactiveUserResult[0].id,
      class_schedule_id: testScheduleId
    };

    await expect(createBooking(input)).rejects.toThrow(/user not found or inactive/i);
  });

  it('should reject booking for non-existent class schedule', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      class_schedule_id: 99999
    };

    await expect(createBooking(input)).rejects.toThrow(/class schedule not found/i);
  });

  it('should reject booking for cancelled class schedule', async () => {
    // Update schedule to be cancelled
    await db.update(classSchedulesTable)
      .set({ is_cancelled: true })
      .where(eq(classSchedulesTable.id, testScheduleId))
      .execute();

    const input = {
      ...testInput,
      user_id: testUserId,
      class_schedule_id: testScheduleId
    };

    await expect(createBooking(input)).rejects.toThrow(/class schedule not found/i);
  });

  it('should reject booking for inactive class', async () => {
    // Update class to be inactive
    await db.update(classesTable)
      .set({ is_active: false })
      .where(eq(classesTable.id, testClassId))
      .execute();

    const input = {
      ...testInput,
      user_id: testUserId,
      class_schedule_id: testScheduleId
    };

    await expect(createBooking(input)).rejects.toThrow(/class schedule not found/i);
  });

  it('should prevent duplicate booking for same user and schedule', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      class_schedule_id: testScheduleId
    };

    // Create first booking
    await createBooking(input);

    // Try to create duplicate booking
    await expect(createBooking(input)).rejects.toThrow(/already has a confirmed booking/i);
  });

  it('should reject booking when class is at full capacity', async () => {
    // Create additional users to fill up the class
    const userIds: number[] = [];
    
    for (let i = 0; i < 10; i++) {
      const userResult = await db.insert(usersTable)
        .values({
          email: `user${i}@example.com`,
          password_hash: 'hashed_password',
          first_name: `User${i}`,
          last_name: 'Test',
          role: 'member',
          is_active: true
        })
        .returning()
        .execute();
      
      userIds.push(userResult[0].id);
    }

    // Book the class to full capacity (max_capacity = 10)
    for (const userId of userIds) {
      await db.insert(bookingsTable)
        .values({
          user_id: userId,
          class_schedule_id: testScheduleId,
          status: 'confirmed'
        })
        .execute();
    }

    // Try to book with our test user (should fail)
    const input = {
      ...testInput,
      user_id: testUserId,
      class_schedule_id: testScheduleId
    };

    await expect(createBooking(input)).rejects.toThrow(/class is at full capacity/i);
  });

  it('should allow booking when there are cancelled bookings', async () => {
    // Create a cancelled booking (should not count toward capacity)
    await db.insert(bookingsTable)
      .values({
        user_id: testUserId,
        class_schedule_id: testScheduleId,
        status: 'cancelled'
      })
      .execute();

    // Create second user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'member',
        is_active: true
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      user_id: userResult[0].id,
      class_schedule_id: testScheduleId
    };

    // Should succeed because cancelled booking doesn't count toward capacity
    const result = await createBooking(input);
    expect(result.status).toEqual('confirmed');
  });

  it('should correctly count only confirmed bookings for capacity', async () => {
    // Create users with different booking statuses
    const users = [];
    for (let i = 0; i < 3; i++) {
      const userResult = await db.insert(usersTable)
        .values({
          email: `capacity-test${i}@example.com`,
          password_hash: 'hashed_password',
          first_name: `User${i}`,
          last_name: 'Test',
          role: 'member',
          is_active: true
        })
        .returning()
        .execute();
      users.push(userResult[0]);
    }

    // Create bookings with different statuses
    await db.insert(bookingsTable)
      .values([
        { user_id: users[0].id, class_schedule_id: testScheduleId, status: 'confirmed' },
        { user_id: users[1].id, class_schedule_id: testScheduleId, status: 'cancelled' },
        { user_id: users[2].id, class_schedule_id: testScheduleId, status: 'no_show' }
      ])
      .execute();

    // Should succeed because only 1 confirmed booking exists (capacity = 10)
    const input = {
      ...testInput,
      user_id: testUserId,
      class_schedule_id: testScheduleId
    };

    const result = await createBooking(input);
    expect(result.status).toEqual('confirmed');

    // Verify total confirmed bookings
    const confirmedCount = await db.select({ count: count() })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.class_schedule_id, testScheduleId),
          eq(bookingsTable.status, 'confirmed')
        )
      )
      .execute();

    expect(confirmedCount[0].count).toEqual(2); // Original confirmed + our new booking
  });
});
