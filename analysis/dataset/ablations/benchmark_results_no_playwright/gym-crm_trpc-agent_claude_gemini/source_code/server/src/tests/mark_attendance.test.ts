import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, classesTable, classSchedulesTable, bookingsTable } from '../db/schema';
import { markAttendance } from '../handlers/mark_attendance';
import { eq } from 'drizzle-orm';

describe('markAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testMemberId: number;
  let testClassId: number;
  let testScheduleId: number;
  let testBookingId: number;

  beforeEach(async () => {
    // Create prerequisite test data
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        phone: '123-456-7890',
        membership_type: 'basic',
        membership_start_date: '2024-01-01',
        membership_end_date: '2024-12-31'
      })
      .returning()
      .execute();
    testMemberId = memberResult[0].id;

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        instructor_name: 'Jane Smith',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'yoga',
        difficulty_level: 'beginner'
      })
      .returning()
      .execute();
    testClassId = classResult[0].id;

    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: testClassId,
        scheduled_date: '2024-01-15',
        start_time: '10:00',
        end_time: '11:00'
      })
      .returning()
      .execute();
    testScheduleId = scheduleResult[0].id;

    const bookingResult = await db.insert(bookingsTable)
      .values({
        member_id: testMemberId,
        class_schedule_id: testScheduleId,
        booking_status: 'booked'
      })
      .returning()
      .execute();
    testBookingId = bookingResult[0].id;
  });

  it('should mark attendance as attended when attended is true', async () => {
    const result = await markAttendance(testBookingId, true);

    expect(result.success).toBe(true);

    // Verify the booking was updated in the database
    const updatedBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, testBookingId))
      .execute();

    expect(updatedBooking).toHaveLength(1);
    expect(updatedBooking[0].booking_status).toBe('attended');
    expect(updatedBooking[0].attendance_marked_at).toBeInstanceOf(Date);
    expect(updatedBooking[0].updated_at).toBeInstanceOf(Date);
  });

  it('should mark attendance as no_show when attended is false', async () => {
    const result = await markAttendance(testBookingId, false);

    expect(result.success).toBe(true);

    // Verify the booking was updated in the database
    const updatedBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, testBookingId))
      .execute();

    expect(updatedBooking).toHaveLength(1);
    expect(updatedBooking[0].booking_status).toBe('no_show');
    expect(updatedBooking[0].attendance_marked_at).toBeInstanceOf(Date);
    expect(updatedBooking[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return success false for non-existent booking', async () => {
    const nonExistentBookingId = 99999;
    
    const result = await markAttendance(nonExistentBookingId, true);

    expect(result.success).toBe(false);
  });

  it('should update attendance_marked_at timestamp', async () => {
    const beforeTime = new Date();
    
    const result = await markAttendance(testBookingId, true);
    
    expect(result.success).toBe(true);

    const updatedBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, testBookingId))
      .execute();

    const attendanceTime = updatedBooking[0].attendance_marked_at;
    expect(attendanceTime).toBeInstanceOf(Date);
    expect(attendanceTime!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
  });

  it('should update an existing attendance record', async () => {
    // First mark attendance as attended
    await markAttendance(testBookingId, true);

    // Verify it was marked as attended
    let booking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, testBookingId))
      .execute();
    
    expect(booking[0].booking_status).toBe('attended');
    const firstAttendanceTime = booking[0].attendance_marked_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Now change to no_show
    const result = await markAttendance(testBookingId, false);
    expect(result.success).toBe(true);

    // Verify it was updated to no_show with new timestamp
    booking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, testBookingId))
      .execute();

    expect(booking[0].booking_status).toBe('no_show');
    expect(booking[0].attendance_marked_at).toBeInstanceOf(Date);
    expect(booking[0].attendance_marked_at!.getTime()).toBeGreaterThan(firstAttendanceTime!.getTime());
  });

  it('should work with cancelled bookings', async () => {
    // First update booking to cancelled status
    await db.update(bookingsTable)
      .set({ booking_status: 'cancelled' })
      .where(eq(bookingsTable.id, testBookingId))
      .execute();

    // Mark attendance (even though it was cancelled)
    const result = await markAttendance(testBookingId, true);

    expect(result.success).toBe(true);

    // Verify the status was changed to attended
    const updatedBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, testBookingId))
      .execute();

    expect(updatedBooking[0].booking_status).toBe('attended');
    expect(updatedBooking[0].attendance_marked_at).toBeInstanceOf(Date);
  });
});
