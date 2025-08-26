import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, classesTable, classSchedulesTable, bookingsTable } from '../db/schema';
import { type GetBookingsInput } from '../schema';
import { getBookings } from '../handlers/get_bookings';

// Test data setup
const testMember = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-0123',
  membership_type: 'premium' as const,
  membership_start_date: '2024-01-01',
  membership_end_date: '2024-12-31',
  is_active: true
};

const testClass = {
  name: 'Morning Yoga',
  description: 'Peaceful morning yoga session',
  instructor_name: 'Jane Smith',
  duration_minutes: 60,
  max_capacity: 20,
  class_type: 'yoga' as const,
  difficulty_level: 'beginner' as const,
  is_active: true
};

const testSchedule = {
  scheduled_date: '2024-02-15',
  start_time: '09:00',
  end_time: '10:00',
  current_bookings: 0,
  is_cancelled: false
};

describe('getBookings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no bookings exist', async () => {
    const result = await getBookings();
    expect(result).toEqual([]);
  });

  it('should return all bookings when no filters provided', async () => {
    // Create prerequisite data
    const [member] = await db.insert(membersTable).values(testMember).returning();
    const [classRecord] = await db.insert(classesTable).values(testClass).returning();
    const [schedule] = await db.insert(classSchedulesTable).values({
      ...testSchedule,
      class_id: classRecord.id
    }).returning();

    // Create multiple bookings
    const bookings = await db.insert(bookingsTable).values([
      {
        member_id: member.id,
        class_schedule_id: schedule.id,
        booking_status: 'booked' as const
      },
      {
        member_id: member.id,
        class_schedule_id: schedule.id,
        booking_status: 'attended' as const
      }
    ]).returning();

    const result = await getBookings();

    expect(result).toHaveLength(2);
    expect(result[0].member_id).toEqual(member.id);
    expect(result[0].class_schedule_id).toEqual(schedule.id);
    expect(result[0].booking_status).toEqual('booked');
    expect(result[0].id).toBeDefined();
    expect(result[0].booking_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter bookings by member_id', async () => {
    // Create two members
    const [member1] = await db.insert(membersTable).values(testMember).returning();
    const [member2] = await db.insert(membersTable).values({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane.doe@example.com',
      phone: '555-0124',
      membership_type: 'premium' as const,
      membership_start_date: '2024-01-01',
      membership_end_date: '2024-12-31',
      is_active: true
    }).returning();

    const [classRecord] = await db.insert(classesTable).values(testClass).returning();
    const [schedule] = await db.insert(classSchedulesTable).values({
      ...testSchedule,
      class_id: classRecord.id
    }).returning();

    // Create bookings for both members
    await db.insert(bookingsTable).values([
      {
        member_id: member1.id,
        class_schedule_id: schedule.id,
        booking_status: 'booked' as const
      },
      {
        member_id: member2.id,
        class_schedule_id: schedule.id,
        booking_status: 'booked' as const
      }
    ]);

    const input: GetBookingsInput = { member_id: member1.id };
    const result = await getBookings(input);

    expect(result).toHaveLength(1);
    expect(result[0].member_id).toEqual(member1.id);
  });

  it('should filter bookings by class_schedule_id', async () => {
    const [member] = await db.insert(membersTable).values(testMember).returning();
    const [classRecord] = await db.insert(classesTable).values(testClass).returning();
    
    // Create two schedules
    const [schedule1] = await db.insert(classSchedulesTable).values({
      ...testSchedule,
      class_id: classRecord.id
    }).returning();
    
    const [schedule2] = await db.insert(classSchedulesTable).values({
      class_id: classRecord.id,
      scheduled_date: '2024-02-16',
      start_time: '10:00',
      end_time: '11:00',
      current_bookings: 0,
      is_cancelled: false
    }).returning();

    // Create bookings for both schedules
    await db.insert(bookingsTable).values([
      {
        member_id: member.id,
        class_schedule_id: schedule1.id,
        booking_status: 'booked' as const
      },
      {
        member_id: member.id,
        class_schedule_id: schedule2.id,
        booking_status: 'booked' as const
      }
    ]);

    const input: GetBookingsInput = { class_schedule_id: schedule1.id };
    const result = await getBookings(input);

    expect(result).toHaveLength(1);
    expect(result[0].class_schedule_id).toEqual(schedule1.id);
  });

  it('should filter bookings by booking_status', async () => {
    const [member] = await db.insert(membersTable).values(testMember).returning();
    const [classRecord] = await db.insert(classesTable).values(testClass).returning();
    const [schedule] = await db.insert(classSchedulesTable).values({
      ...testSchedule,
      class_id: classRecord.id
    }).returning();

    // Create bookings with different statuses
    await db.insert(bookingsTable).values([
      {
        member_id: member.id,
        class_schedule_id: schedule.id,
        booking_status: 'booked' as const
      },
      {
        member_id: member.id,
        class_schedule_id: schedule.id,
        booking_status: 'cancelled' as const
      },
      {
        member_id: member.id,
        class_schedule_id: schedule.id,
        booking_status: 'attended' as const
      }
    ]);

    const input: GetBookingsInput = { booking_status: 'attended' };
    const result = await getBookings(input);

    expect(result).toHaveLength(1);
    expect(result[0].booking_status).toEqual('attended');
  });

  it('should filter bookings by date range', async () => {
    const [member] = await db.insert(membersTable).values(testMember).returning();
    const [classRecord] = await db.insert(classesTable).values(testClass).returning();
    const [schedule] = await db.insert(classSchedulesTable).values({
      ...testSchedule,
      class_id: classRecord.id
    }).returning();

    const today = new Date('2024-02-15T10:00:00Z');
    const yesterday = new Date('2024-02-14T10:00:00Z');
    const tomorrow = new Date('2024-02-16T10:00:00Z');

    // Create bookings with different dates
    await db.insert(bookingsTable).values([
      {
        member_id: member.id,
        class_schedule_id: schedule.id,
        booking_status: 'booked' as const,
        booking_date: yesterday
      },
      {
        member_id: member.id,
        class_schedule_id: schedule.id,
        booking_status: 'booked' as const,
        booking_date: today
      },
      {
        member_id: member.id,
        class_schedule_id: schedule.id,
        booking_status: 'booked' as const,
        booking_date: tomorrow
      }
    ]);

    // Test date_from filter
    const fromInput: GetBookingsInput = { date_from: today };
    const fromResult = await getBookings(fromInput);
    expect(fromResult).toHaveLength(2);

    // Test date_to filter
    const toInput: GetBookingsInput = { date_to: today };
    const toResult = await getBookings(toInput);
    expect(toResult).toHaveLength(2);

    // Test date range filter
    const rangeInput: GetBookingsInput = { 
      date_from: today, 
      date_to: today 
    };
    const rangeResult = await getBookings(rangeInput);
    expect(rangeResult).toHaveLength(1);
    expect(rangeResult[0].booking_date).toEqual(today);
  });

  it('should handle multiple filters combined', async () => {
    // Create two members
    const [member1] = await db.insert(membersTable).values(testMember).returning();
    const [member2] = await db.insert(membersTable).values({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane.doe@example.com',
      phone: '555-0124',
      membership_type: 'premium' as const,
      membership_start_date: '2024-01-01',
      membership_end_date: '2024-12-31',
      is_active: true
    }).returning();

    const [classRecord] = await db.insert(classesTable).values(testClass).returning();
    const [schedule] = await db.insert(classSchedulesTable).values({
      ...testSchedule,
      class_id: classRecord.id
    }).returning();

    const today = new Date('2024-02-15T10:00:00Z');
    const tomorrow = new Date('2024-02-16T10:00:00Z');

    // Create various bookings
    await db.insert(bookingsTable).values([
      {
        member_id: member1.id,
        class_schedule_id: schedule.id,
        booking_status: 'attended' as const,
        booking_date: today
      },
      {
        member_id: member1.id,
        class_schedule_id: schedule.id,
        booking_status: 'cancelled' as const,
        booking_date: today
      },
      {
        member_id: member2.id,
        class_schedule_id: schedule.id,
        booking_status: 'attended' as const,
        booking_date: today
      },
      {
        member_id: member1.id,
        class_schedule_id: schedule.id,
        booking_status: 'attended' as const,
        booking_date: tomorrow
      }
    ]);

    // Filter by member_id, status, and date
    const input: GetBookingsInput = {
      member_id: member1.id,
      booking_status: 'attended',
      date_from: today,
      date_to: today
    };

    const result = await getBookings(input);

    expect(result).toHaveLength(1);
    expect(result[0].member_id).toEqual(member1.id);
    expect(result[0].booking_status).toEqual('attended');
    expect(result[0].booking_date).toEqual(today);
  });

  it('should return empty array when filters match no bookings', async () => {
    const [member] = await db.insert(membersTable).values(testMember).returning();
    const [classRecord] = await db.insert(classesTable).values(testClass).returning();
    const [schedule] = await db.insert(classSchedulesTable).values({
      ...testSchedule,
      class_id: classRecord.id
    }).returning();

    await db.insert(bookingsTable).values({
      member_id: member.id,
      class_schedule_id: schedule.id,
      booking_status: 'booked' as const
    });

    // Filter for non-existent member
    const input: GetBookingsInput = { member_id: 99999 };
    const result = await getBookings(input);

    expect(result).toEqual([]);
  });

  it('should include all booking fields in response', async () => {
    const [member] = await db.insert(membersTable).values(testMember).returning();
    const [classRecord] = await db.insert(classesTable).values(testClass).returning();
    const [schedule] = await db.insert(classSchedulesTable).values({
      ...testSchedule,
      class_id: classRecord.id
    }).returning();

    const cancellationDate = new Date('2024-02-10T15:30:00Z');
    const attendanceDate = new Date('2024-02-15T09:15:00Z');

    await db.insert(bookingsTable).values({
      member_id: member.id,
      class_schedule_id: schedule.id,
      booking_status: 'attended' as const,
      cancellation_date: cancellationDate,
      attendance_marked_at: attendanceDate
    });

    const result = await getBookings();

    expect(result).toHaveLength(1);
    const booking = result[0];
    
    // Check all required fields are present
    expect(booking.id).toBeDefined();
    expect(booking.member_id).toEqual(member.id);
    expect(booking.class_schedule_id).toEqual(schedule.id);
    expect(booking.booking_status).toEqual('attended');
    expect(booking.booking_date).toBeInstanceOf(Date);
    expect(booking.cancellation_date).toEqual(cancellationDate);
    expect(booking.attendance_marked_at).toEqual(attendanceDate);
    expect(booking.created_at).toBeInstanceOf(Date);
    expect(booking.updated_at).toBeInstanceOf(Date);
  });
});
