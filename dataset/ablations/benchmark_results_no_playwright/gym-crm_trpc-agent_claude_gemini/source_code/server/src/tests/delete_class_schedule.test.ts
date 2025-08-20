import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, classesTable, classSchedulesTable, bookingsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { deleteClassSchedule } from '../handlers/delete_class_schedule';

// Test data
const testMember = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-0123',
  membership_type: 'basic' as const,
  membership_start_date: '2024-01-01',
  membership_end_date: '2024-12-31'
};

const testClass = {
  name: 'Morning Yoga',
  description: 'Relaxing morning yoga session',
  instructor_name: 'Jane Smith',
  duration_minutes: 60,
  max_capacity: 20,
  class_type: 'yoga' as const,
  difficulty_level: 'beginner' as const
};

const createFutureSchedule = (daysFromNow: number = 1) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysFromNow);
  return {
    scheduled_date: futureDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD string
    start_time: '09:00',
    end_time: '10:00'
  };
};

const createPastSchedule = () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  return {
    scheduled_date: pastDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD string
    start_time: '09:00',
    end_time: '10:00'
  };
};

describe('deleteClassSchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a future class schedule successfully', async () => {
    // Create prerequisite data
    const memberResult = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        ...createFutureSchedule(),
        class_id: classResult[0].id
      })
      .returning()
      .execute();

    const scheduleId = scheduleResult[0].id;

    // Delete the schedule
    const result = await deleteClassSchedule(scheduleId);

    // Verify result
    expect(result.success).toBe(true);

    // Verify schedule is deleted from database
    const deletedSchedules = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, scheduleId))
      .execute();

    expect(deletedSchedules).toHaveLength(0);
  });

  it('should delete all existing bookings when deleting schedule', async () => {
    // Create prerequisite data
    const memberResult = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        ...createFutureSchedule(),
        class_id: classResult[0].id
      })
      .returning()
      .execute();

    // Create a booking for this schedule
    await db.insert(bookingsTable)
      .values({
        member_id: memberResult[0].id,
        class_schedule_id: scheduleResult[0].id,
        booking_status: 'booked'
      })
      .returning()
      .execute();

    const scheduleId = scheduleResult[0].id;

    // Delete the schedule
    await deleteClassSchedule(scheduleId);

    // Verify all bookings for this schedule were deleted
    const remainingBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.class_schedule_id, scheduleId))
      .execute();

    expect(remainingBookings).toHaveLength(0);
  });

  it('should delete all bookings regardless of status', async () => {
    // Create prerequisite data
    const memberResult = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        ...createFutureSchedule(),
        class_id: classResult[0].id
      })
      .returning()
      .execute();

    // Create two bookings - one booked, one already cancelled
    await db.insert(bookingsTable)
      .values([
        {
          member_id: memberResult[0].id,
          class_schedule_id: scheduleResult[0].id,
          booking_status: 'booked'
        },
        {
          member_id: memberResult[0].id,
          class_schedule_id: scheduleResult[0].id,
          booking_status: 'cancelled',
          cancellation_date: new Date('2024-01-01')
        }
      ])
      .returning()
      .execute();

    const scheduleId = scheduleResult[0].id;

    // Delete the schedule
    await deleteClassSchedule(scheduleId);

    // Verify all bookings for this schedule were deleted
    const remainingBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.class_schedule_id, scheduleId))
      .execute();

    expect(remainingBookings).toHaveLength(0);
  });

  it('should throw error when class schedule does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteClassSchedule(nonExistentId))
      .rejects.toThrow(/class schedule not found/i);
  });

  it('should throw error when trying to delete past class schedule', async () => {
    // Create prerequisite data
    const classResult = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        ...createPastSchedule(),
        class_id: classResult[0].id
      })
      .returning()
      .execute();

    const scheduleId = scheduleResult[0].id;

    await expect(deleteClassSchedule(scheduleId))
      .rejects.toThrow(/cannot delete past or current day class schedules/i);

    // Verify schedule still exists
    const existingSchedules = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, scheduleId))
      .execute();

    expect(existingSchedules).toHaveLength(1);
  });

  it('should throw error when trying to delete current day class schedule', async () => {
    // Create prerequisite data
    const classResult = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    const today = new Date();
    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: classResult[0].id,
        scheduled_date: today.toISOString().split('T')[0], // Convert to YYYY-MM-DD string
        start_time: '09:00',
        end_time: '10:00'
      })
      .returning()
      .execute();

    const scheduleId = scheduleResult[0].id;

    await expect(deleteClassSchedule(scheduleId))
      .rejects.toThrow(/cannot delete past or current day class schedules/i);

    // Verify schedule still exists
    const existingSchedules = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, scheduleId))
      .execute();

    expect(existingSchedules).toHaveLength(1);
  });

  it('should handle deletion when no bookings exist', async () => {
    // Create prerequisite data
    const classResult = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        ...createFutureSchedule(),
        class_id: classResult[0].id
      })
      .returning()
      .execute();

    const scheduleId = scheduleResult[0].id;

    // Delete the schedule (no bookings exist)
    const result = await deleteClassSchedule(scheduleId);

    // Verify result
    expect(result.success).toBe(true);

    // Verify schedule is deleted
    const deletedSchedules = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, scheduleId))
      .execute();

    expect(deletedSchedules).toHaveLength(0);
  });

  it('should handle deletion with multiple bookings of different statuses', async () => {
    // Create prerequisite data
    const memberResult = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        ...createFutureSchedule(),
        class_id: classResult[0].id,
        current_bookings: 3
      })
      .returning()
      .execute();

    // Create bookings with different statuses
    await db.insert(bookingsTable)
      .values([
        {
          member_id: memberResult[0].id,
          class_schedule_id: scheduleResult[0].id,
          booking_status: 'booked'
        },
        {
          member_id: memberResult[0].id,
          class_schedule_id: scheduleResult[0].id,
          booking_status: 'attended',
          attendance_marked_at: new Date()
        },
        {
          member_id: memberResult[0].id,
          class_schedule_id: scheduleResult[0].id,
          booking_status: 'cancelled',
          cancellation_date: new Date()
        }
      ])
      .returning()
      .execute();

    const scheduleId = scheduleResult[0].id;

    // Delete the schedule
    const result = await deleteClassSchedule(scheduleId);

    expect(result.success).toBe(true);

    // Verify all bookings for this schedule were deleted
    const remainingBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.class_schedule_id, scheduleId))
      .execute();

    expect(remainingBookings).toHaveLength(0);

    // Verify schedule is deleted
    const deletedSchedules = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, scheduleId))
      .execute();

    expect(deletedSchedules).toHaveLength(0);
  });
});
