import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, classesTable, classSchedulesTable, bookingsTable } from '../db/schema';
import { deleteMember } from '../handlers/delete_member';
import { eq, and, gte } from 'drizzle-orm';

// Test data
const testMember = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-1234',
  membership_type: 'basic' as const,
  membership_start_date: '2024-01-01',
  membership_end_date: '2024-12-31'
};

const testClass = {
  name: 'Morning Yoga',
  description: 'Relaxing yoga session',
  instructor_name: 'Jane Smith',
  duration_minutes: 60,
  max_capacity: 20,
  class_type: 'yoga' as const,
  difficulty_level: 'beginner' as const
};

describe('deleteMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should soft delete a member by setting is_active to false', async () => {
    // Create test member
    const [member] = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();

    // Delete the member
    const result = await deleteMember(member.id);

    // Verify result
    expect(result.success).toBe(true);

    // Verify member is soft deleted
    const deletedMember = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, member.id))
      .execute();

    expect(deletedMember).toHaveLength(1);
    expect(deletedMember[0].is_active).toBe(false);
    expect(deletedMember[0].updated_at).toBeInstanceOf(Date);
  });

  it('should cancel future bookings when deleting a member', async () => {
    // Create test member
    const [member] = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();

    // Create test class
    const [testClassRecord] = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create future class schedule
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const [futureSchedule] = await db.insert(classSchedulesTable)
      .values({
        class_id: testClassRecord.id,
        scheduled_date: tomorrowStr,
        start_time: '09:00',
        end_time: '10:00',
        current_bookings: 1
      })
      .returning()
      .execute();

    // Create past class schedule
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const [pastSchedule] = await db.insert(classSchedulesTable)
      .values({
        class_id: testClassRecord.id,
        scheduled_date: yesterdayStr,
        start_time: '09:00',
        end_time: '10:00',
        current_bookings: 1
      })
      .returning()
      .execute();

    // Create future booking (should be cancelled)
    const [futureBooking] = await db.insert(bookingsTable)
      .values({
        member_id: member.id,
        class_schedule_id: futureSchedule.id,
        booking_status: 'booked'
      })
      .returning()
      .execute();

    // Create past booking (should remain unchanged)
    const [pastBooking] = await db.insert(bookingsTable)
      .values({
        member_id: member.id,
        class_schedule_id: pastSchedule.id,
        booking_status: 'attended'
      })
      .returning()
      .execute();

    // Delete the member
    const result = await deleteMember(member.id);

    // Verify result
    expect(result.success).toBe(true);

    // Verify future booking is cancelled
    const updatedFutureBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, futureBooking.id))
      .execute();

    expect(updatedFutureBooking[0].booking_status).toBe('cancelled');
    expect(updatedFutureBooking[0].cancellation_date).toBeInstanceOf(Date);

    // Verify past booking remains unchanged
    const unchangedPastBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, pastBooking.id))
      .execute();

    expect(unchangedPastBooking[0].booking_status).toBe('attended');
    expect(unchangedPastBooking[0].cancellation_date).toBeNull();

    // Verify current_bookings count is decremented for future schedule
    const updatedFutureSchedule = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, futureSchedule.id))
      .execute();

    expect(updatedFutureSchedule[0].current_bookings).toBe(0);

    // Verify current_bookings count remains unchanged for past schedule
    const unchangedPastSchedule = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, pastSchedule.id))
      .execute();

    expect(unchangedPastSchedule[0].current_bookings).toBe(1);
  });

  it('should only cancel booked future bookings, not cancelled ones', async () => {
    // Create test member
    const [member] = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();

    // Create test class
    const [testClassRecord] = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create future class schedule
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const [futureSchedule] = await db.insert(classSchedulesTable)
      .values({
        class_id: testClassRecord.id,
        scheduled_date: tomorrowStr,
        start_time: '09:00',
        end_time: '10:00',
        current_bookings: 1
      })
      .returning()
      .execute();

    // Create already cancelled booking (should remain unchanged)
    const [cancelledBooking] = await db.insert(bookingsTable)
      .values({
        member_id: member.id,
        class_schedule_id: futureSchedule.id,
        booking_status: 'cancelled',
        cancellation_date: new Date()
      })
      .returning()
      .execute();

    // Delete the member
    const result = await deleteMember(member.id);

    // Verify result
    expect(result.success).toBe(true);

    // Verify already cancelled booking remains unchanged
    const unchangedBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, cancelledBooking.id))
      .execute();

    expect(unchangedBooking[0].booking_status).toBe('cancelled');
    expect(unchangedBooking[0].cancellation_date).toEqual(cancelledBooking.cancellation_date);

    // Verify current_bookings count remains unchanged
    const unchangedSchedule = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, futureSchedule.id))
      .execute();

    expect(unchangedSchedule[0].current_bookings).toBe(1);
  });

  it('should throw error when member does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteMember(nonExistentId)).rejects.toThrow(/Member with id 999 not found/i);
  });

  it('should throw error when member is already deactivated', async () => {
    // Create test member that is already inactive
    const [member] = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();

    // First, deactivate the member
    await db.update(membersTable)
      .set({ is_active: false })
      .where(eq(membersTable.id, member.id))
      .execute();

    await expect(deleteMember(member.id)).rejects.toThrow(/Member with id \d+ is already deactivated/i);
  });

  it('should handle member with no bookings', async () => {
    // Create test member with no bookings
    const [member] = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();

    // Delete the member
    const result = await deleteMember(member.id);

    // Verify result
    expect(result.success).toBe(true);

    // Verify member is soft deleted
    const deletedMember = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, member.id))
      .execute();

    expect(deletedMember[0].is_active).toBe(false);
  });

  it('should handle multiple future bookings correctly', async () => {
    // Create test member
    const [member] = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();

    // Create test class
    const [testClassRecord] = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create multiple future class schedules
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

    const [schedule1] = await db.insert(classSchedulesTable)
      .values({
        class_id: testClassRecord.id,
        scheduled_date: tomorrowStr,
        start_time: '09:00',
        end_time: '10:00',
        current_bookings: 2
      })
      .returning()
      .execute();

    const [schedule2] = await db.insert(classSchedulesTable)
      .values({
        class_id: testClassRecord.id,
        scheduled_date: dayAfterTomorrowStr,
        start_time: '14:00',
        end_time: '15:00',
        current_bookings: 3
      })
      .returning()
      .execute();

    // Create multiple bookings
    await db.insert(bookingsTable)
      .values([
        {
          member_id: member.id,
          class_schedule_id: schedule1.id,
          booking_status: 'booked'
        },
        {
          member_id: member.id,
          class_schedule_id: schedule2.id,
          booking_status: 'booked'
        }
      ])
      .execute();

    // Delete the member
    const result = await deleteMember(member.id);

    // Verify result
    expect(result.success).toBe(true);

    // Verify all member bookings are cancelled
    const cancelledBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.member_id, member.id))
      .execute();

    expect(cancelledBookings).toHaveLength(2);
    cancelledBookings.forEach(booking => {
      expect(booking.booking_status).toBe('cancelled');
      expect(booking.cancellation_date).toBeInstanceOf(Date);
    });

    // Verify current_bookings counts are decremented
    const updatedSchedule1 = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, schedule1.id))
      .execute();

    const updatedSchedule2 = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, schedule2.id))
      .execute();

    expect(updatedSchedule1[0].current_bookings).toBe(1); // 2 - 1
    expect(updatedSchedule2[0].current_bookings).toBe(2); // 3 - 1
  });
});
