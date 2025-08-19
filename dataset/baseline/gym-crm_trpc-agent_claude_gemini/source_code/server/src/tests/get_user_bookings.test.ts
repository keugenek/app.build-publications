import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, classSchedulesTable, bookingsTable } from '../db/schema';
import { type GetUserBookingsQuery } from '../schema';
import { getUserBookings } from '../handlers/get_user_bookings';

// Test data setup
const testUser = {
  email: 'testuser@example.com',
  password_hash: 'hashedpassword123',
  first_name: 'Test',
  last_name: 'User',
  role: 'member' as const
};

const testClass = {
  name: 'Test Yoga Class',
  description: 'A relaxing yoga session',
  class_type: 'yoga' as const,
  instructor_name: 'Jane Doe',
  max_capacity: 20,
  duration_minutes: 60,
  price: '25.00'
};

describe('getUserBookings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return bookings for a specific user', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create class
    const [createdClass] = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create class schedule
    const startTime = new Date('2024-12-20T10:00:00Z');
    const endTime = new Date('2024-12-20T11:00:00Z');
    const [schedule] = await db.insert(classSchedulesTable)
      .values({
        class_id: createdClass.id,
        start_time: startTime,
        end_time: endTime,
        room_name: 'Studio A'
      })
      .returning()
      .execute();

    // Create booking
    const [booking] = await db.insert(bookingsTable)
      .values({
        user_id: user.id,
        class_schedule_id: schedule.id,
        status: 'confirmed'
      })
      .returning()
      .execute();

    // Test query
    const query: GetUserBookingsQuery = {
      user_id: user.id
    };

    const result = await getUserBookings(query);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(booking.id);
    expect(result[0].user_id).toEqual(user.id);
    expect(result[0].class_schedule_id).toEqual(schedule.id);
    expect(result[0].status).toEqual('confirmed');
    expect(result[0].booked_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when user has no bookings', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const query: GetUserBookingsQuery = {
      user_id: user.id
    };

    const result = await getUserBookings(query);

    expect(result).toHaveLength(0);
  });

  it('should filter bookings by start date', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create class
    const [createdClass] = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create two class schedules with different dates
    const schedule1StartTime = new Date('2024-12-15T10:00:00Z');
    const schedule1EndTime = new Date('2024-12-15T11:00:00Z');
    const [schedule1] = await db.insert(classSchedulesTable)
      .values({
        class_id: createdClass.id,
        start_time: schedule1StartTime,
        end_time: schedule1EndTime,
        room_name: 'Studio A'
      })
      .returning()
      .execute();

    const schedule2StartTime = new Date('2024-12-25T10:00:00Z');
    const schedule2EndTime = new Date('2024-12-25T11:00:00Z');
    const [schedule2] = await db.insert(classSchedulesTable)
      .values({
        class_id: createdClass.id,
        start_time: schedule2StartTime,
        end_time: schedule2EndTime,
        room_name: 'Studio B'
      })
      .returning()
      .execute();

    // Create bookings for both schedules
    await db.insert(bookingsTable)
      .values([
        {
          user_id: user.id,
          class_schedule_id: schedule1.id,
          status: 'confirmed'
        },
        {
          user_id: user.id,
          class_schedule_id: schedule2.id,
          status: 'confirmed'
        }
      ])
      .execute();

    // Test query with start date filter
    const query: GetUserBookingsQuery = {
      user_id: user.id,
      start_date: new Date('2024-12-20T00:00:00Z')
    };

    const result = await getUserBookings(query);

    expect(result).toHaveLength(1);
    expect(result[0].class_schedule_id).toEqual(schedule2.id);
  });

  it('should filter bookings by end date', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create class
    const [createdClass] = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create two class schedules with different dates
    const schedule1StartTime = new Date('2024-12-15T10:00:00Z');
    const schedule1EndTime = new Date('2024-12-15T11:00:00Z');
    const [schedule1] = await db.insert(classSchedulesTable)
      .values({
        class_id: createdClass.id,
        start_time: schedule1StartTime,
        end_time: schedule1EndTime,
        room_name: 'Studio A'
      })
      .returning()
      .execute();

    const schedule2StartTime = new Date('2024-12-25T10:00:00Z');
    const schedule2EndTime = new Date('2024-12-25T11:00:00Z');
    const [schedule2] = await db.insert(classSchedulesTable)
      .values({
        class_id: createdClass.id,
        start_time: schedule2StartTime,
        end_time: schedule2EndTime,
        room_name: 'Studio B'
      })
      .returning()
      .execute();

    // Create bookings for both schedules
    await db.insert(bookingsTable)
      .values([
        {
          user_id: user.id,
          class_schedule_id: schedule1.id,
          status: 'confirmed'
        },
        {
          user_id: user.id,
          class_schedule_id: schedule2.id,
          status: 'confirmed'
        }
      ])
      .execute();

    // Test query with end date filter
    const query: GetUserBookingsQuery = {
      user_id: user.id,
      end_date: new Date('2024-12-20T00:00:00Z')
    };

    const result = await getUserBookings(query);

    expect(result).toHaveLength(1);
    expect(result[0].class_schedule_id).toEqual(schedule1.id);
  });

  it('should filter bookings by date range', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create class
    const [createdClass] = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create three class schedules with different dates
    const schedules = await Promise.all([
      db.insert(classSchedulesTable)
        .values({
          class_id: createdClass.id,
          start_time: new Date('2024-12-10T10:00:00Z'),
          end_time: new Date('2024-12-10T11:00:00Z'),
          room_name: 'Studio A'
        })
        .returning()
        .execute(),
      db.insert(classSchedulesTable)
        .values({
          class_id: createdClass.id,
          start_time: new Date('2024-12-20T10:00:00Z'),
          end_time: new Date('2024-12-20T11:00:00Z'),
          room_name: 'Studio B'
        })
        .returning()
        .execute(),
      db.insert(classSchedulesTable)
        .values({
          class_id: createdClass.id,
          start_time: new Date('2024-12-30T10:00:00Z'),
          end_time: new Date('2024-12-30T11:00:00Z'),
          room_name: 'Studio C'
        })
        .returning()
        .execute()
    ]);

    // Create bookings for all schedules
    await db.insert(bookingsTable)
      .values([
        {
          user_id: user.id,
          class_schedule_id: schedules[0][0].id,
          status: 'confirmed'
        },
        {
          user_id: user.id,
          class_schedule_id: schedules[1][0].id,
          status: 'confirmed'
        },
        {
          user_id: user.id,
          class_schedule_id: schedules[2][0].id,
          status: 'confirmed'
        }
      ])
      .execute();

    // Test query with date range filter
    const query: GetUserBookingsQuery = {
      user_id: user.id,
      start_date: new Date('2024-12-15T00:00:00Z'),
      end_date: new Date('2024-12-25T00:00:00Z')
    };

    const result = await getUserBookings(query);

    expect(result).toHaveLength(1);
    expect(result[0].class_schedule_id).toEqual(schedules[1][0].id);
  });

  it('should return bookings ordered by start time descending', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create class
    const [createdClass] = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create schedules with different start times
    const earlySchedule = await db.insert(classSchedulesTable)
      .values({
        class_id: createdClass.id,
        start_time: new Date('2024-12-20T09:00:00Z'),
        end_time: new Date('2024-12-20T10:00:00Z'),
        room_name: 'Studio A'
      })
      .returning()
      .execute();

    const lateSchedule = await db.insert(classSchedulesTable)
      .values({
        class_id: createdClass.id,
        start_time: new Date('2024-12-20T15:00:00Z'),
        end_time: new Date('2024-12-20T16:00:00Z'),
        room_name: 'Studio B'
      })
      .returning()
      .execute();

    // Create bookings
    await db.insert(bookingsTable)
      .values([
        {
          user_id: user.id,
          class_schedule_id: earlySchedule[0].id,
          status: 'confirmed'
        },
        {
          user_id: user.id,
          class_schedule_id: lateSchedule[0].id,
          status: 'confirmed'
        }
      ])
      .execute();

    const query: GetUserBookingsQuery = {
      user_id: user.id
    };

    const result = await getUserBookings(query);

    expect(result).toHaveLength(2);
    // Should be ordered by start_time descending, so later schedule comes first
    expect(result[0].class_schedule_id).toEqual(lateSchedule[0].id);
    expect(result[1].class_schedule_id).toEqual(earlySchedule[0].id);
  });

  it('should only return bookings for the specified user', async () => {
    // Create two users
    const [user1] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        ...testUser,
        email: 'user2@example.com'
      })
      .returning()
      .execute();

    // Create class and schedule
    const [createdClass] = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    const [schedule] = await db.insert(classSchedulesTable)
      .values({
        class_id: createdClass.id,
        start_time: new Date('2024-12-20T10:00:00Z'),
        end_time: new Date('2024-12-20T11:00:00Z'),
        room_name: 'Studio A'
      })
      .returning()
      .execute();

    // Create bookings for both users
    await db.insert(bookingsTable)
      .values([
        {
          user_id: user1.id,
          class_schedule_id: schedule.id,
          status: 'confirmed'
        },
        {
          user_id: user2.id,
          class_schedule_id: schedule.id,
          status: 'confirmed'
        }
      ])
      .execute();

    // Test query for user1 only
    const query: GetUserBookingsQuery = {
      user_id: user1.id
    };

    const result = await getUserBookings(query);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1.id);
  });
});
