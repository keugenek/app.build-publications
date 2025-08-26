import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, classSchedulesTable, bookingsTable } from '../db/schema';
import { cancelBooking } from '../handlers/cancel_booking';
import { eq } from 'drizzle-orm';

describe('cancelBooking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testClassId: number;
  let testScheduleId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        role: 'member'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Yoga Class',
        class_type: 'yoga',
        instructor_name: 'Jane Doe',
        max_capacity: 20,
        duration_minutes: 60,
        price: '25.00'
      })
      .returning()
      .execute();
    testClassId = classResult[0].id;

    // Create test class schedule
    const scheduleResult = await db.insert(classSchedulesTable)
      .values({
        class_id: testClassId,
        start_time: new Date('2024-12-20T10:00:00Z'),
        end_time: new Date('2024-12-20T11:00:00Z'),
        room_name: 'Studio A'
      })
      .returning()
      .execute();
    testScheduleId = scheduleResult[0].id;
  });

  it('should cancel a confirmed booking', async () => {
    // Create a confirmed booking
    const bookingResult = await db.insert(bookingsTable)
      .values({
        user_id: testUserId,
        class_schedule_id: testScheduleId,
        status: 'confirmed'
      })
      .returning()
      .execute();

    const bookingId = bookingResult[0].id;

    // Cancel the booking
    const result = await cancelBooking(bookingId);

    // Verify the result
    expect(result.id).toEqual(bookingId);
    expect(result.status).toEqual('cancelled');
    expect(result.user_id).toEqual(testUserId);
    expect(result.class_schedule_id).toEqual(testScheduleId);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify it's updated in the database
    const updatedBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .execute();

    expect(updatedBooking[0].status).toEqual('cancelled');
    expect(updatedBooking[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when booking does not exist', async () => {
    const nonExistentId = 99999;

    await expect(cancelBooking(nonExistentId))
      .rejects
      .toThrow(/Booking with id 99999 not found/i);
  });

  it('should throw error when booking is already cancelled', async () => {
    // Create a cancelled booking
    const bookingResult = await db.insert(bookingsTable)
      .values({
        user_id: testUserId,
        class_schedule_id: testScheduleId,
        status: 'cancelled'
      })
      .returning()
      .execute();

    const bookingId = bookingResult[0].id;

    // Try to cancel again
    await expect(cancelBooking(bookingId))
      .rejects
      .toThrow(/Booking is already cancelled/i);
  });

  it('should throw error when trying to cancel attended booking', async () => {
    // Create an attended booking
    const bookingResult = await db.insert(bookingsTable)
      .values({
        user_id: testUserId,
        class_schedule_id: testScheduleId,
        status: 'attended'
      })
      .returning()
      .execute();

    const bookingId = bookingResult[0].id;

    // Try to cancel attended booking
    await expect(cancelBooking(bookingId))
      .rejects
      .toThrow(/Cannot cancel booking with status: attended/i);
  });

  it('should throw error when trying to cancel no_show booking', async () => {
    // Create a no_show booking
    const bookingResult = await db.insert(bookingsTable)
      .values({
        user_id: testUserId,
        class_schedule_id: testScheduleId,
        status: 'no_show'
      })
      .returning()
      .execute();

    const bookingId = bookingResult[0].id;

    // Try to cancel no_show booking
    await expect(cancelBooking(bookingId))
      .rejects
      .toThrow(/Cannot cancel booking with status: no_show/i);
  });

  it('should preserve original booking timestamps except updated_at', async () => {
    const originalBookedAt = new Date('2024-12-15T08:00:00Z');
    
    // Create a confirmed booking with specific booked_at time
    const bookingResult = await db.insert(bookingsTable)
      .values({
        user_id: testUserId,
        class_schedule_id: testScheduleId,
        status: 'confirmed',
        booked_at: originalBookedAt
      })
      .returning()
      .execute();

    const bookingId = bookingResult[0].id;

    // Cancel the booking
    const result = await cancelBooking(bookingId);

    // Verify original booked_at is preserved but updated_at is changed
    expect(result.booked_at).toEqual(originalBookedAt);
    expect(result.updated_at).not.toEqual(originalBookedAt);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalBookedAt.getTime());
  });
});
