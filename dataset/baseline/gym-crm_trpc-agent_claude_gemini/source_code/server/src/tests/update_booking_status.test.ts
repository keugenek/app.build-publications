import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, classSchedulesTable, bookingsTable } from '../db/schema';
import { type UpdateBookingStatusInput } from '../schema';
import { updateBookingStatus } from '../handlers/update_booking_status';
import { eq } from 'drizzle-orm';

describe('updateBookingStatus', () => {
  let testUserId: number;
  let testClassId: number;
  let testClassScheduleId: number;
  let testBookingId: number;

  beforeEach(async () => {
    await createDB();

    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'member@test.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        role: 'member',
        phone: null,
        date_of_birth: null,
        membership_start_date: null,
        membership_end_date: null
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create a test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Yoga Class',
        description: 'A relaxing yoga session',
        class_type: 'yoga',
        instructor_name: 'Jane Smith',
        max_capacity: 20,
        duration_minutes: 60,
        price: '25.00'
      })
      .returning()
      .execute();
    testClassId = classResult[0].id;

    // Create a test class schedule
    const startTime = new Date('2024-02-15T10:00:00Z');
    const endTime = new Date('2024-02-15T11:00:00Z');
    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: testClassId,
        start_time: startTime,
        end_time: endTime,
        room_name: 'Studio A'
      })
      .returning()
      .execute();
    testClassScheduleId = scheduleResult[0].id;

    // Create a test booking
    const bookingResult = await db.insert(bookingsTable)
      .values({
        user_id: testUserId,
        class_schedule_id: testClassScheduleId,
        status: 'confirmed'
      })
      .returning()
      .execute();
    testBookingId = bookingResult[0].id;
  });

  afterEach(resetDB);

  it('should update booking status to attended', async () => {
    const input: UpdateBookingStatusInput = {
      id: testBookingId,
      status: 'attended'
    };

    const result = await updateBookingStatus(input);

    expect(result.id).toEqual(testBookingId);
    expect(result.status).toEqual('attended');
    expect(result.user_id).toEqual(testUserId);
    expect(result.class_schedule_id).toEqual(testClassScheduleId);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.booked_at).toBeInstanceOf(Date);
  });

  it('should update booking status to no_show', async () => {
    const input: UpdateBookingStatusInput = {
      id: testBookingId,
      status: 'no_show'
    };

    const result = await updateBookingStatus(input);

    expect(result.id).toEqual(testBookingId);
    expect(result.status).toEqual('no_show');
    expect(result.user_id).toEqual(testUserId);
    expect(result.class_schedule_id).toEqual(testClassScheduleId);
  });

  it('should update booking status to cancelled', async () => {
    const input: UpdateBookingStatusInput = {
      id: testBookingId,
      status: 'cancelled'
    };

    const result = await updateBookingStatus(input);

    expect(result.id).toEqual(testBookingId);
    expect(result.status).toEqual('cancelled');
    expect(result.user_id).toEqual(testUserId);
    expect(result.class_schedule_id).toEqual(testClassScheduleId);
  });

  it('should save updated booking status to database', async () => {
    const input: UpdateBookingStatusInput = {
      id: testBookingId,
      status: 'attended'
    };

    await updateBookingStatus(input);

    // Query database to verify the update
    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, testBookingId))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].status).toEqual('attended');
    expect(bookings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original booking timestamp
    const originalBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, testBookingId))
      .execute();
    const originalTimestamp = originalBooking[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateBookingStatusInput = {
      id: testBookingId,
      status: 'attended'
    };

    const result = await updateBookingStatus(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should throw error for non-existent booking', async () => {
    const input: UpdateBookingStatusInput = {
      id: 99999,
      status: 'attended'
    };

    expect(async () => {
      await updateBookingStatus(input);
    }).toThrow(/Booking with id 99999 not found/);
  });

  it('should preserve other booking fields when updating status', async () => {
    const input: UpdateBookingStatusInput = {
      id: testBookingId,
      status: 'no_show'
    };

    const result = await updateBookingStatus(input);

    // Verify all original fields are preserved
    expect(result.user_id).toEqual(testUserId);
    expect(result.class_schedule_id).toEqual(testClassScheduleId);
    expect(result.booked_at).toBeInstanceOf(Date);
    
    // Only status and updated_at should have changed
    expect(result.status).toEqual('no_show');
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
