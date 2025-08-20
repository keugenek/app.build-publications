import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, classesTable, bookingsTable } from '../db/schema';
import { type UpdateBookingInput } from '../schema';
import { updateBookingStatus } from '../handlers/update_booking_status';
import { eq } from 'drizzle-orm';

describe('updateBookingStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let memberId: number;
  let classId: number;
  let bookingId: number;

  beforeEach(async () => {
    // Create prerequisite member
    const memberResult = await db.insert(membersTable)
      .values({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        phone: '123-456-7890',
        membership_type: 'basic',
        status: 'active'
      })
      .returning()
      .execute();
    
    memberId = memberResult[0].id;

    // Create prerequisite class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        instructor_name: 'Test Instructor',
        duration_minutes: 60,
        max_capacity: 20,
        class_date: '2024-01-15',
        start_time: '10:00',
        status: 'scheduled'
      })
      .returning()
      .execute();
    
    classId = classResult[0].id;

    // Create a booking to update
    const bookingResult = await db.insert(bookingsTable)
      .values({
        member_id: memberId,
        class_id: classId,
        status: 'booked'
      })
      .returning()
      .execute();
    
    bookingId = bookingResult[0].id;
  });

  it('should update booking status to attended', async () => {
    const input: UpdateBookingInput = {
      id: bookingId,
      status: 'attended'
    };

    const result = await updateBookingStatus(input);

    expect(result.id).toEqual(bookingId);
    expect(result.status).toEqual('attended');
    expect(result.member_id).toEqual(memberId);
    expect(result.class_id).toEqual(classId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update booking status to no_show', async () => {
    const input: UpdateBookingInput = {
      id: bookingId,
      status: 'no_show'
    };

    const result = await updateBookingStatus(input);

    expect(result.id).toEqual(bookingId);
    expect(result.status).toEqual('no_show');
    expect(result.member_id).toEqual(memberId);
    expect(result.class_id).toEqual(classId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update booking status to cancelled', async () => {
    const input: UpdateBookingInput = {
      id: bookingId,
      status: 'cancelled'
    };

    const result = await updateBookingStatus(input);

    expect(result.id).toEqual(bookingId);
    expect(result.status).toEqual('cancelled');
    expect(result.member_id).toEqual(memberId);
    expect(result.class_id).toEqual(classId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated status to database', async () => {
    const input: UpdateBookingInput = {
      id: bookingId,
      status: 'attended'
    };

    await updateBookingStatus(input);

    // Verify the booking was updated in the database
    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].status).toEqual('attended');
    expect(bookings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original booking
    const originalBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .execute();

    const originalUpdatedAt = originalBooking[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateBookingInput = {
      id: bookingId,
      status: 'attended'
    };

    const result = await updateBookingStatus(input);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error when booking does not exist', async () => {
    const input: UpdateBookingInput = {
      id: 99999, // Non-existent booking ID
      status: 'attended'
    };

    await expect(updateBookingStatus(input)).rejects.toThrow(/not found/i);
  });

  it('should handle status change from booked to attended', async () => {
    // Verify initial status
    const initialBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .execute();

    expect(initialBooking[0].status).toEqual('booked');

    const input: UpdateBookingInput = {
      id: bookingId,
      status: 'attended'
    };

    const result = await updateBookingStatus(input);

    expect(result.status).toEqual('attended');
    expect(result.id).toEqual(bookingId);
  });

  it('should preserve other booking fields when updating status', async () => {
    const input: UpdateBookingInput = {
      id: bookingId,
      status: 'no_show'
    };

    const result = await updateBookingStatus(input);

    // Verify other fields remain unchanged
    expect(result.member_id).toEqual(memberId);
    expect(result.class_id).toEqual(classId);
    expect(result.booked_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Only status and updated_at should have changed
    expect(result.status).toEqual('no_show');
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
