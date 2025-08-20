import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, classesTable, classSchedulesTable, bookingsTable } from '../db/schema';
import { getClassAttendance } from '../handlers/get_class_attendance';

// Test data setup
const testMember1 = {
  first_name: 'Alice',
  last_name: 'Brown',
  email: 'alice.brown@example.com',
  phone: '555-0101',
  membership_type: 'premium' as const,
  membership_start_date: '2024-01-01',
  membership_end_date: '2024-12-31'
};

const testMember2 = {
  first_name: 'Bob',
  last_name: 'Anderson',
  email: 'bob.anderson@example.com',
  phone: '555-0102',
  membership_type: 'basic' as const,
  membership_start_date: '2024-01-01',
  membership_end_date: '2024-12-31'
};

const testMember3 = {
  first_name: 'Charlie',
  last_name: 'Davis',
  email: 'charlie.davis@example.com',
  phone: null,
  membership_type: 'vip' as const,
  membership_start_date: '2024-01-01',
  membership_end_date: '2024-12-31'
};

const testClass = {
  name: 'Morning Yoga',
  description: 'Relaxing yoga session',
  instructor_name: 'Sarah Johnson',
  duration_minutes: 60,
  max_capacity: 20,
  class_type: 'yoga' as const,
  difficulty_level: 'beginner' as const
};

const testSchedule = {
  scheduled_date: '2024-03-15',
  start_time: '09:00',
  end_time: '10:00'
};

describe('getClassAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all bookings for a specific class schedule ordered by member name', async () => {
    // Create test members
    const members = await db.insert(membersTable)
      .values([testMember1, testMember2, testMember3])
      .returning()
      .execute();

    // Create test class
    const classes = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create test class schedule
    const schedules = await db.insert(classSchedulesTable)
      .values({
        ...testSchedule,
        class_id: classes[0].id
      })
      .returning()
      .execute();

    // Create bookings with different statuses
    await db.insert(bookingsTable)
      .values([
        {
          member_id: members[0].id, // Alice Brown
          class_schedule_id: schedules[0].id,
          booking_status: 'booked'
        },
        {
          member_id: members[1].id, // Bob Anderson
          class_schedule_id: schedules[0].id,
          booking_status: 'attended'
        },
        {
          member_id: members[2].id, // Charlie Davis
          class_schedule_id: schedules[0].id,
          booking_status: 'no_show'
        }
      ])
      .execute();

    const result = await getClassAttendance(schedules[0].id);

    expect(result).toHaveLength(3);
    
    // Should be ordered by last name (Anderson, Brown, Davis)
    expect(result[0].member_id).toEqual(members[1].id); // Bob Anderson
    expect(result[1].member_id).toEqual(members[0].id); // Alice Brown
    expect(result[2].member_id).toEqual(members[2].id); // Charlie Davis

    // Verify booking properties
    expect(result[0].booking_status).toEqual('attended');
    expect(result[1].booking_status).toEqual('booked');
    expect(result[2].booking_status).toEqual('no_show');

    // Verify all bookings are for the correct class schedule
    result.forEach(booking => {
      expect(booking.class_schedule_id).toEqual(schedules[0].id);
      expect(booking.id).toBeDefined();
      expect(booking.booking_date).toBeInstanceOf(Date);
      expect(booking.created_at).toBeInstanceOf(Date);
      expect(booking.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when no bookings exist for class schedule', async () => {
    // Create test class and schedule but no bookings
    const classes = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    const schedules = await db.insert(classSchedulesTable)
      .values({
        ...testSchedule,
        class_id: classes[0].id
      })
      .returning()
      .execute();

    const result = await getClassAttendance(schedules[0].id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent class schedule', async () => {
    const result = await getClassAttendance(99999);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle bookings with all status types correctly', async () => {
    // Create test member
    const members = await db.insert(membersTable)
      .values(testMember1)
      .returning()
      .execute();

    // Create test class
    const classes = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create test class schedule
    const schedules = await db.insert(classSchedulesTable)
      .values({
        ...testSchedule,
        class_id: classes[0].id
      })
      .returning()
      .execute();

    // Create booking with attendance marked
    const attendanceTime = new Date('2024-03-15T09:00:00Z');
    await db.insert(bookingsTable)
      .values({
        member_id: members[0].id,
        class_schedule_id: schedules[0].id,
        booking_status: 'attended',
        attendance_marked_at: attendanceTime
      })
      .execute();

    const result = await getClassAttendance(schedules[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].booking_status).toEqual('attended');
    expect(result[0].attendance_marked_at).toBeInstanceOf(Date);
    expect(result[0].attendance_marked_at?.getTime()).toEqual(attendanceTime.getTime());
  });

  it('should handle bookings with cancellation information', async () => {
    // Create test member
    const members = await db.insert(membersTable)
      .values(testMember1)
      .returning()
      .execute();

    // Create test class
    const classes = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create test class schedule
    const schedules = await db.insert(classSchedulesTable)
      .values({
        ...testSchedule,
        class_id: classes[0].id
      })
      .returning()
      .execute();

    // Create cancelled booking
    const cancellationTime = new Date('2024-03-14T15:30:00Z');
    await db.insert(bookingsTable)
      .values({
        member_id: members[0].id,
        class_schedule_id: schedules[0].id,
        booking_status: 'cancelled',
        cancellation_date: cancellationTime
      })
      .execute();

    const result = await getClassAttendance(schedules[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].booking_status).toEqual('cancelled');
    expect(result[0].cancellation_date).toBeInstanceOf(Date);
    expect(result[0].cancellation_date?.getTime()).toEqual(cancellationTime.getTime());
  });

  it('should order members by last name then first name correctly', async () => {
    // Create members with same last name but different first names
    const members = await db.insert(membersTable)
      .values([
        {
          first_name: 'Zoe',
          last_name: 'Smith',
          email: 'zoe.smith@example.com',
          phone: null,
          membership_type: 'basic' as const,
          membership_start_date: '2024-01-01',
          membership_end_date: '2024-12-31'
        },
        {
          first_name: 'Alice',
          last_name: 'Smith',
          email: 'alice.smith@example.com',
          phone: null,
          membership_type: 'premium' as const,
          membership_start_date: '2024-01-01',
          membership_end_date: '2024-12-31'
        },
        {
          first_name: 'Bob',
          last_name: 'Adams',
          email: 'bob.adams@example.com',
          phone: null,
          membership_type: 'vip' as const,
          membership_start_date: '2024-01-01',
          membership_end_date: '2024-12-31'
        }
      ])
      .returning()
      .execute();

    // Create test class and schedule
    const classes = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    const schedules = await db.insert(classSchedulesTable)
      .values({
        ...testSchedule,
        class_id: classes[0].id
      })
      .returning()
      .execute();

    // Create bookings for all members
    await db.insert(bookingsTable)
      .values([
        {
          member_id: members[0].id, // Zoe Smith
          class_schedule_id: schedules[0].id,
          booking_status: 'booked'
        },
        {
          member_id: members[1].id, // Alice Smith
          class_schedule_id: schedules[0].id,
          booking_status: 'booked'
        },
        {
          member_id: members[2].id, // Bob Adams
          class_schedule_id: schedules[0].id,
          booking_status: 'booked'
        }
      ])
      .execute();

    const result = await getClassAttendance(schedules[0].id);

    expect(result).toHaveLength(3);
    
    // Should be ordered: Adams (Bob), Smith (Alice), Smith (Zoe)
    expect(result[0].member_id).toEqual(members[2].id); // Bob Adams
    expect(result[1].member_id).toEqual(members[1].id); // Alice Smith (first name comes before Zoe)
    expect(result[2].member_id).toEqual(members[0].id); // Zoe Smith
  });
});
