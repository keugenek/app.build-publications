import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, membersTable, classSchedulesTable, bookingsTable } from '../db/schema';
import { deleteClass } from '../handlers/delete_class';
import { eq, and } from 'drizzle-orm';

describe('deleteClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should soft delete a class by setting is_active to false', async () => {
    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Yoga Class',
        description: 'A relaxing yoga session',
        instructor_name: 'Jane Smith',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'yoga',
        difficulty_level: 'beginner',
        is_active: true
      })
      .returning()
      .execute();

    // Delete the class
    const result = await deleteClass(testClass.id);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify class is soft deleted
    const deletedClass = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, testClass.id))
      .execute();

    expect(deletedClass).toHaveLength(1);
    expect(deletedClass[0].is_active).toBe(false);
    expect(deletedClass[0].updated_at).toBeInstanceOf(Date);
  });

  it('should cancel future class schedules when deleting a class', async () => {
    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Cardio Class',
        description: 'High intensity workout',
        instructor_name: 'John Doe',
        duration_minutes: 45,
        max_capacity: 15,
        class_type: 'cardio',
        difficulty_level: 'intermediate',
        is_active: true
      })
      .returning()
      .execute();

    // Create past schedule (should not be cancelled)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    const [pastSchedule] = await db.insert(classSchedulesTable)
      .values({
        class_id: testClass.id,
        scheduled_date: yesterdayString,
        start_time: '09:00',
        end_time: '10:00',
        current_bookings: 5,
        is_cancelled: false
      })
      .returning()
      .execute();

    // Create future schedule (should be cancelled)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    const [futureSchedule] = await db.insert(classSchedulesTable)
      .values({
        class_id: testClass.id,
        scheduled_date: tomorrowString,
        start_time: '10:00',
        end_time: '11:00',
        current_bookings: 3,
        is_cancelled: false
      })
      .returning()
      .execute();

    // Delete the class
    await deleteClass(testClass.id);

    // Verify past schedule remains unchanged
    const pastScheduleResult = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, pastSchedule.id))
      .execute();

    expect(pastScheduleResult[0].is_cancelled).toBe(false);
    expect(pastScheduleResult[0].cancellation_reason).toBeNull();

    // Verify future schedule is cancelled
    const futureScheduleResult = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, futureSchedule.id))
      .execute();

    expect(futureScheduleResult[0].is_cancelled).toBe(true);
    expect(futureScheduleResult[0].cancellation_reason).toBe('Class deactivated');
    expect(futureScheduleResult[0].updated_at).toBeInstanceOf(Date);
  });

  it('should cancel future bookings when deleting a class', async () => {
    // Create test member
    const today = new Date();
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    const [testMember] = await db.insert(membersTable)
      .values({
        first_name: 'Test',
        last_name: 'Member',
        email: 'test@example.com',
        phone: '123-456-7890',
        membership_type: 'basic',
        membership_start_date: today.toISOString().split('T')[0],
        membership_end_date: oneYearFromNow.toISOString().split('T')[0],
        is_active: true
      })
      .returning()
      .execute();

    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Strength Class',
        description: 'Weight training session',
        instructor_name: 'Mike Johnson',
        duration_minutes: 50,
        max_capacity: 12,
        class_type: 'strength',
        difficulty_level: 'advanced',
        is_active: true
      })
      .returning()
      .execute();

    // Create future schedule
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    const [futureSchedule] = await db.insert(classSchedulesTable)
      .values({
        class_id: testClass.id,
        scheduled_date: tomorrowString,
        start_time: '14:00',
        end_time: '15:00',
        current_bookings: 1,
        is_cancelled: false
      })
      .returning()
      .execute();

    // Create booking for future schedule
    const [testBooking] = await db.insert(bookingsTable)
      .values({
        member_id: testMember.id,
        class_schedule_id: futureSchedule.id,
        booking_status: 'booked'
      })
      .returning()
      .execute();

    // Delete the class
    await deleteClass(testClass.id);

    // Verify booking is cancelled
    const cancelledBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, testBooking.id))
      .execute();

    expect(cancelledBooking[0].booking_status).toBe('cancelled');
    expect(cancelledBooking[0].cancellation_date).toBeInstanceOf(Date);
    expect(cancelledBooking[0].updated_at).toBeInstanceOf(Date);
  });

  it('should preserve past bookings and schedules for historical tracking', async () => {
    // Create test member
    const today = new Date();
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    const [testMember] = await db.insert(membersTable)
      .values({
        first_name: 'History',
        last_name: 'Member',
        email: 'history@example.com',
        phone: null,
        membership_type: 'premium',
        membership_start_date: today.toISOString().split('T')[0],
        membership_end_date: oneYearFromNow.toISOString().split('T')[0],
        is_active: true
      })
      .returning()
      .execute();

    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Historical Pilates Class',
        description: 'Core strengthening',
        instructor_name: 'Sarah Wilson',
        duration_minutes: 55,
        max_capacity: 10,
        class_type: 'pilates',
        difficulty_level: 'intermediate',
        is_active: true
      })
      .returning()
      .execute();

    // Create past schedule
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    const [pastSchedule] = await db.insert(classSchedulesTable)
      .values({
        class_id: testClass.id,
        scheduled_date: yesterdayString,
        start_time: '11:00',
        end_time: '12:00',
        current_bookings: 1,
        is_cancelled: false
      })
      .returning()
      .execute();

    // Create past booking with attendance
    const [pastBooking] = await db.insert(bookingsTable)
      .values({
        member_id: testMember.id,
        class_schedule_id: pastSchedule.id,
        booking_status: 'attended',
        attendance_marked_at: new Date()
      })
      .returning()
      .execute();

    // Delete the class
    await deleteClass(testClass.id);

    // Verify past schedule remains unchanged
    const pastScheduleResult = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, pastSchedule.id))
      .execute();

    expect(pastScheduleResult[0].is_cancelled).toBe(false);
    expect(pastScheduleResult[0].current_bookings).toBe(1);

    // Verify past booking remains unchanged
    const pastBookingResult = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, pastBooking.id))
      .execute();

    expect(pastBookingResult[0].booking_status).toBe('attended');
    expect(pastBookingResult[0].cancellation_date).toBeNull();
    expect(pastBookingResult[0].attendance_marked_at).toBeInstanceOf(Date);
  });

  it('should throw error when trying to delete non-existent class', async () => {
    const nonExistentId = 999;

    await expect(deleteClass(nonExistentId)).rejects.toThrow(/Class with id 999 not found/i);
  });

  it('should handle class with no schedules', async () => {
    // Create test class with no schedules
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Unscheduled Class',
        description: 'Never been scheduled',
        instructor_name: 'New Instructor',
        duration_minutes: 30,
        max_capacity: 5,
        class_type: 'dance',
        difficulty_level: 'beginner',
        is_active: true
      })
      .returning()
      .execute();

    // Delete the class
    const result = await deleteClass(testClass.id);

    // Verify success
    expect(result.success).toBe(true);

    // Verify class is soft deleted
    const deletedClass = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, testClass.id))
      .execute();

    expect(deletedClass[0].is_active).toBe(false);
  });

  it('should only cancel bookings with "booked" status', async () => {
    // Create test member
    const today = new Date();
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    const [testMember] = await db.insert(membersTable)
      .values({
        first_name: 'Status',
        last_name: 'Test',
        email: 'status@example.com',
        phone: null,
        membership_type: 'vip',
        membership_start_date: today.toISOString().split('T')[0],
        membership_end_date: oneYearFromNow.toISOString().split('T')[0],
        is_active: true
      })
      .returning()
      .execute();

    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Status Test Class',
        description: 'Testing booking statuses',
        instructor_name: 'Test Instructor',
        duration_minutes: 40,
        max_capacity: 8,
        class_type: 'crossfit',
        difficulty_level: 'advanced',
        is_active: true
      })
      .returning()
      .execute();

    // Create future schedule
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    const [futureSchedule] = await db.insert(classSchedulesTable)
      .values({
        class_id: testClass.id,
        scheduled_date: tomorrowString,
        start_time: '16:00',
        end_time: '17:00',
        current_bookings: 2,
        is_cancelled: false
      })
      .returning()
      .execute();

    // Create bookings with different statuses
    const [bookedBooking] = await db.insert(bookingsTable)
      .values({
        member_id: testMember.id,
        class_schedule_id: futureSchedule.id,
        booking_status: 'booked'
      })
      .returning()
      .execute();

    const [alreadyCancelledBooking] = await db.insert(bookingsTable)
      .values({
        member_id: testMember.id,
        class_schedule_id: futureSchedule.id,
        booking_status: 'cancelled',
        cancellation_date: new Date()
      })
      .returning()
      .execute();

    // Delete the class
    await deleteClass(testClass.id);

    // Verify booked booking is cancelled
    const bookedResult = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookedBooking.id))
      .execute();

    expect(bookedResult[0].booking_status).toBe('cancelled');
    expect(bookedResult[0].cancellation_date).toBeInstanceOf(Date);

    // Verify already cancelled booking remains unchanged
    const cancelledResult = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, alreadyCancelledBooking.id))
      .execute();

    expect(cancelledResult[0].booking_status).toBe('cancelled');
    // Should have original cancellation date, not updated one
    expect(cancelledResult[0].cancellation_date).toEqual(alreadyCancelledBooking.cancellation_date);
  });
});
