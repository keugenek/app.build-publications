import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, classSchedulesTable, bookingsTable } from '../db/schema';
import { type GetClassAttendanceQuery } from '../schema';
import { getClassAttendance } from '../handlers/get_class_attendance';

// Test data setup
const testUser1 = {
  email: 'john.doe@example.com',
  password_hash: 'hashed_password_123',
  first_name: 'John',
  last_name: 'Doe',
  role: 'member' as const,
  phone: '555-1234',
  date_of_birth: new Date('1990-01-15'),
  membership_start_date: new Date('2024-01-01'),
  membership_end_date: new Date('2024-12-31')
};

const testUser2 = {
  email: 'jane.smith@example.com',
  password_hash: 'hashed_password_456',
  first_name: 'Jane',
  last_name: 'Smith',
  role: 'member' as const,
  phone: '555-5678',
  date_of_birth: new Date('1985-03-20'),
  membership_start_date: new Date('2024-01-01'),
  membership_end_date: new Date('2024-12-31')
};

const testClass = {
  name: 'Morning Yoga',
  description: 'Relaxing morning yoga session',
  class_type: 'yoga' as const,
  instructor_name: 'Sarah Johnson',
  max_capacity: 20,
  duration_minutes: 60,
  price: '25.00'
};

describe('getClassAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get all bookings for a specific class schedule', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create test class
    const classes = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create class schedule
    const schedules = await db.insert(classSchedulesTable)
      .values({
        class_id: classes[0].id,
        start_time: new Date('2024-03-01T09:00:00Z'),
        end_time: new Date('2024-03-01T10:00:00Z'),
        room_name: 'Studio A'
      })
      .returning()
      .execute();

    // Create bookings for the class schedule
    await db.insert(bookingsTable)
      .values([
        {
          user_id: users[0].id,
          class_schedule_id: schedules[0].id,
          status: 'confirmed'
        },
        {
          user_id: users[1].id,
          class_schedule_id: schedules[0].id,
          status: 'attended'
        }
      ])
      .execute();

    const query: GetClassAttendanceQuery = {
      class_schedule_id: schedules[0].id
    };

    const result = await getClassAttendance(query);

    // Should return all bookings for the class schedule
    expect(result).toHaveLength(2);

    // Verify booking details
    const booking1 = result.find(b => b.user_id === users[0].id);
    const booking2 = result.find(b => b.user_id === users[1].id);

    expect(booking1).toBeDefined();
    expect(booking1!.class_schedule_id).toEqual(schedules[0].id);
    expect(booking1!.status).toEqual('confirmed');
    expect(booking1!.booked_at).toBeInstanceOf(Date);
    expect(booking1!.updated_at).toBeInstanceOf(Date);

    expect(booking2).toBeDefined();
    expect(booking2!.class_schedule_id).toEqual(schedules[0].id);
    expect(booking2!.status).toEqual('attended');

    // Verify user details are included
    expect((booking1 as any).user).toBeDefined();
    expect((booking1 as any).user.first_name).toEqual('John');
    expect((booking1 as any).user.last_name).toEqual('Doe');
    expect((booking1 as any).user.email).toEqual('john.doe@example.com');
    expect((booking1 as any).user.phone).toEqual('555-1234');

    expect((booking2 as any).user).toBeDefined();
    expect((booking2 as any).user.first_name).toEqual('Jane');
    expect((booking2 as any).user.last_name).toEqual('Smith');
    expect((booking2 as any).user.email).toEqual('jane.smith@example.com');
    expect((booking2 as any).user.phone).toEqual('555-5678');
  });

  it('should return empty array when no bookings exist for class schedule', async () => {
    // Create test class and schedule but no bookings
    const classes = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    const schedules = await db.insert(classSchedulesTable)
      .values({
        class_id: classes[0].id,
        start_time: new Date('2024-03-01T09:00:00Z'),
        end_time: new Date('2024-03-01T10:00:00Z'),
        room_name: 'Studio A'
      })
      .returning()
      .execute();

    const query: GetClassAttendanceQuery = {
      class_schedule_id: schedules[0].id
    };

    const result = await getClassAttendance(query);

    expect(result).toHaveLength(0);
  });

  it('should return only bookings for the specified class schedule', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute();

    // Create test class
    const classes = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create two different class schedules
    const schedules = await db.insert(classSchedulesTable)
      .values([
        {
          class_id: classes[0].id,
          start_time: new Date('2024-03-01T09:00:00Z'),
          end_time: new Date('2024-03-01T10:00:00Z'),
          room_name: 'Studio A'
        },
        {
          class_id: classes[0].id,
          start_time: new Date('2024-03-01T11:00:00Z'),
          end_time: new Date('2024-03-01T12:00:00Z'),
          room_name: 'Studio B'
        }
      ])
      .returning()
      .execute();

    // Create bookings for both schedules
    await db.insert(bookingsTable)
      .values([
        {
          user_id: users[0].id,
          class_schedule_id: schedules[0].id,
          status: 'confirmed'
        },
        {
          user_id: users[0].id,
          class_schedule_id: schedules[1].id,
          status: 'attended'
        }
      ])
      .execute();

    const query: GetClassAttendanceQuery = {
      class_schedule_id: schedules[0].id
    };

    const result = await getClassAttendance(query);

    // Should only return booking for the first schedule
    expect(result).toHaveLength(1);
    expect(result[0].class_schedule_id).toEqual(schedules[0].id);
    expect(result[0].status).toEqual('confirmed');
  });

  it('should handle bookings with different statuses', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create test class
    const classes = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create class schedule
    const schedules = await db.insert(classSchedulesTable)
      .values({
        class_id: classes[0].id,
        start_time: new Date('2024-03-01T09:00:00Z'),
        end_time: new Date('2024-03-01T10:00:00Z'),
        room_name: 'Studio A'
      })
      .returning()
      .execute();

    // Create bookings with different statuses
    await db.insert(bookingsTable)
      .values([
        {
          user_id: users[0].id,
          class_schedule_id: schedules[0].id,
          status: 'confirmed'
        },
        {
          user_id: users[1].id,
          class_schedule_id: schedules[0].id,
          status: 'cancelled'
        }
      ])
      .execute();

    const query: GetClassAttendanceQuery = {
      class_schedule_id: schedules[0].id
    };

    const result = await getClassAttendance(query);

    expect(result).toHaveLength(2);

    const statuses = result.map(booking => booking.status);
    expect(statuses).toContain('confirmed');
    expect(statuses).toContain('cancelled');
  });

  it('should handle non-existent class schedule gracefully', async () => {
    const query: GetClassAttendanceQuery = {
      class_schedule_id: 99999 // Non-existent ID
    };

    const result = await getClassAttendance(query);

    expect(result).toHaveLength(0);
  });
});
