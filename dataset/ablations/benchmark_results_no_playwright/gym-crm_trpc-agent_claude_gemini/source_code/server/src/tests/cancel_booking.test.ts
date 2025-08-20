import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookingsTable, classSchedulesTable, membersTable, classesTable } from '../db/schema';
import { cancelBooking } from '../handlers/cancel_booking';
import { eq } from 'drizzle-orm';

describe('cancelBooking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully cancel a future booking', async () => {
    // Create test data
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        membership_type: 'basic',
        membership_start_date: '2024-01-01',
        membership_end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Yoga Class',
        description: 'Relaxing yoga session',
        instructor_name: 'Jane Smith',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'yoga',
        difficulty_level: 'beginner'
      })
      .returning()
      .execute();

    // Create a future class schedule (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split('T')[0];

    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: classResult[0].id,
        scheduled_date: tomorrowDateString,
        start_time: '10:00',
        end_time: '11:00',
        current_bookings: 1
      })
      .returning()
      .execute();

    const bookingResult = await db.insert(bookingsTable)
      .values({
        member_id: memberResult[0].id,
        class_schedule_id: scheduleResult[0].id,
        booking_status: 'booked'
      })
      .returning()
      .execute();

    // Cancel the booking
    const result = await cancelBooking(bookingResult[0].id);

    // Verify result
    expect(result.success).toBe(true);

    // Verify booking status updated
    const updatedBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingResult[0].id))
      .execute();

    expect(updatedBooking[0].booking_status).toBe('cancelled');
    expect(updatedBooking[0].cancellation_date).toBeInstanceOf(Date);

    // Verify current_bookings decremented
    const updatedSchedule = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, scheduleResult[0].id))
      .execute();

    expect(updatedSchedule[0].current_bookings).toBe(0);
  });

  it('should throw error for non-existent booking', async () => {
    await expect(cancelBooking(999)).rejects.toThrow(/booking not found/i);
  });

  it('should throw error when trying to cancel already cancelled booking', async () => {
    // Create test data
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        membership_type: 'basic',
        membership_start_date: '2024-01-01',
        membership_end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Yoga Class',
        description: 'Relaxing yoga session',
        instructor_name: 'Jane Smith',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'yoga',
        difficulty_level: 'beginner'
      })
      .returning()
      .execute();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split('T')[0];

    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: classResult[0].id,
        scheduled_date: tomorrowDateString,
        start_time: '10:00',
        end_time: '11:00',
        current_bookings: 0
      })
      .returning()
      .execute();

    // Create already cancelled booking
    const bookingResult = await db.insert(bookingsTable)
      .values({
        member_id: memberResult[0].id,
        class_schedule_id: scheduleResult[0].id,
        booking_status: 'cancelled',
        cancellation_date: new Date()
      })
      .returning()
      .execute();

    await expect(cancelBooking(bookingResult[0].id)).rejects.toThrow(/already cancelled/i);
  });

  it('should throw error when trying to cancel past booking', async () => {
    // Create test data
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        membership_type: 'basic',
        membership_start_date: '2024-01-01',
        membership_end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Yoga Class',
        description: 'Relaxing yoga session',
        instructor_name: 'Jane Smith',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'yoga',
        difficulty_level: 'beginner'
      })
      .returning()
      .execute();

    // Create a past class schedule (yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateString = yesterday.toISOString().split('T')[0];

    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: classResult[0].id,
        scheduled_date: yesterdayDateString,
        start_time: '10:00',
        end_time: '11:00',
        current_bookings: 1
      })
      .returning()
      .execute();

    const bookingResult = await db.insert(bookingsTable)
      .values({
        member_id: memberResult[0].id,
        class_schedule_id: scheduleResult[0].id,
        booking_status: 'booked'
      })
      .returning()
      .execute();

    await expect(cancelBooking(bookingResult[0].id)).rejects.toThrow(/cannot cancel bookings for past classes/i);
  });

  it('should allow cancellation of booking for today', async () => {
    // Create test data
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        membership_type: 'basic',
        membership_start_date: '2024-01-01',
        membership_end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Yoga Class',
        description: 'Relaxing yoga session',
        instructor_name: 'Jane Smith',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'yoga',
        difficulty_level: 'beginner'
      })
      .returning()
      .execute();

    // Create a class schedule for today
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];

    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: classResult[0].id,
        scheduled_date: todayDateString,
        start_time: '23:59', // Late today
        end_time: '23:59',
        current_bookings: 1
      })
      .returning()
      .execute();

    const bookingResult = await db.insert(bookingsTable)
      .values({
        member_id: memberResult[0].id,
        class_schedule_id: scheduleResult[0].id,
        booking_status: 'booked'
      })
      .returning()
      .execute();

    // Should allow cancellation of today's booking
    const result = await cancelBooking(bookingResult[0].id);

    expect(result.success).toBe(true);

    // Verify booking was cancelled
    const updatedBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingResult[0].id))
      .execute();

    expect(updatedBooking[0].booking_status).toBe('cancelled');
    expect(updatedBooking[0].cancellation_date).toBeInstanceOf(Date);
  });

  it('should correctly decrement current_bookings from multiple bookings', async () => {
    // Create test data
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        membership_type: 'basic',
        membership_start_date: '2024-01-01',
        membership_end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Yoga Class',
        description: 'Relaxing yoga session',
        instructor_name: 'Jane Smith',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'yoga',
        difficulty_level: 'beginner'
      })
      .returning()
      .execute();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split('T')[0];

    // Create schedule with 3 current bookings
    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: classResult[0].id,
        scheduled_date: tomorrowDateString,
        start_time: '10:00',
        end_time: '11:00',
        current_bookings: 3
      })
      .returning()
      .execute();

    const bookingResult = await db.insert(bookingsTable)
      .values({
        member_id: memberResult[0].id,
        class_schedule_id: scheduleResult[0].id,
        booking_status: 'booked'
      })
      .returning()
      .execute();

    // Cancel one booking
    await cancelBooking(bookingResult[0].id);

    // Verify current_bookings decremented from 3 to 2
    const updatedSchedule = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, scheduleResult[0].id))
      .execute();

    expect(updatedSchedule[0].current_bookings).toBe(2);
  });
});
