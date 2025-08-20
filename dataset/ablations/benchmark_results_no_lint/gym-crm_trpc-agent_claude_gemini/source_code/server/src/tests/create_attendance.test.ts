import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable, classesTable, bookingsTable, attendanceTable } from '../db/schema';
import { type CreateAttendanceInput } from '../schema';
import { createAttendance } from '../handlers/create_attendance';
import { eq } from 'drizzle-orm';

// Helper function to create test user
async function createTestUser() {
  const result = await db.insert(usersTable)
    .values({
      name: 'Test User',
      email: 'test@example.com',
      role: 'member'
    })
    .returning()
    .execute();
  return result[0];
}

// Helper function to create test instructor
async function createTestInstructor() {
  const user = await db.insert(usersTable)
    .values({
      name: 'Test Instructor',
      email: 'instructor@example.com',
      role: 'instructor'
    })
    .returning()
    .execute();

  const instructor = await db.insert(instructorsTable)
    .values({
      user_id: user[0].id,
      specialization: 'Yoga',
      bio: 'Experienced instructor'
    })
    .returning()
    .execute();
  
  return instructor[0];
}

// Helper function to create test class
async function createTestClass(instructorId: number) {
  const result = await db.insert(classesTable)
    .values({
      name: 'Test Class',
      description: 'A test class',
      start_time: new Date('2024-01-01T10:00:00Z'),
      end_time: new Date('2024-01-01T11:00:00Z'),
      instructor_id: instructorId,
      max_capacity: 10
    })
    .returning()
    .execute();
  return result[0];
}

// Helper function to create test booking
async function createTestBooking(userId: number, classId: number) {
  const result = await db.insert(bookingsTable)
    .values({
      user_id: userId,
      class_id: classId,
      booking_status: 'confirmed'
    })
    .returning()
    .execute();
  return result[0];
}

describe('createAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create attendance record for attended booking', async () => {
    // Setup test data
    const user = await createTestUser();
    const instructor = await createTestInstructor();
    const testClass = await createTestClass(instructor.id);
    const booking = await createTestBooking(user.id, testClass.id);

    const testInput: CreateAttendanceInput = {
      booking_id: booking.id,
      attended: true,
      notes: 'Student participated well'
    };

    const result = await createAttendance(testInput);

    // Verify basic fields
    expect(result.booking_id).toEqual(booking.id);
    expect(result.attended).toEqual(true);
    expect(result.notes).toEqual('Student participated well');
    expect(result.id).toBeDefined();
    expect(result.checked_in_at).toBeInstanceOf(Date);
    expect(result.checked_in_at).not.toBeNull();
  });

  it('should create attendance record for non-attended booking', async () => {
    // Setup test data
    const user = await createTestUser();
    const instructor = await createTestInstructor();
    const testClass = await createTestClass(instructor.id);
    const booking = await createTestBooking(user.id, testClass.id);

    const testInput: CreateAttendanceInput = {
      booking_id: booking.id,
      attended: false,
      notes: 'Student was absent'
    };

    const result = await createAttendance(testInput);

    // Verify fields for non-attendance
    expect(result.booking_id).toEqual(booking.id);
    expect(result.attended).toEqual(false);
    expect(result.notes).toEqual('Student was absent');
    expect(result.id).toBeDefined();
    expect(result.checked_in_at).toBeNull();
  });

  it('should create attendance record without notes', async () => {
    // Setup test data
    const user = await createTestUser();
    const instructor = await createTestInstructor();
    const testClass = await createTestClass(instructor.id);
    const booking = await createTestBooking(user.id, testClass.id);

    const testInput: CreateAttendanceInput = {
      booking_id: booking.id,
      attended: true
    };

    const result = await createAttendance(testInput);

    // Verify fields without notes
    expect(result.booking_id).toEqual(booking.id);
    expect(result.attended).toEqual(true);
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.checked_in_at).toBeInstanceOf(Date);
  });

  it('should save attendance record to database', async () => {
    // Setup test data
    const user = await createTestUser();
    const instructor = await createTestInstructor();
    const testClass = await createTestClass(instructor.id);
    const booking = await createTestBooking(user.id, testClass.id);

    const testInput: CreateAttendanceInput = {
      booking_id: booking.id,
      attended: true,
      notes: 'Present and engaged'
    };

    const result = await createAttendance(testInput);

    // Query database to verify record was saved
    const attendanceRecords = await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.id, result.id))
      .execute();

    expect(attendanceRecords).toHaveLength(1);
    const savedRecord = attendanceRecords[0];
    expect(savedRecord.booking_id).toEqual(booking.id);
    expect(savedRecord.attended).toEqual(true);
    expect(savedRecord.notes).toEqual('Present and engaged');
    expect(savedRecord.checked_in_at).toBeInstanceOf(Date);
  });

  it('should throw error when booking does not exist', async () => {
    const testInput: CreateAttendanceInput = {
      booking_id: 999, // Non-existent booking ID
      attended: true,
      notes: 'This should fail'
    };

    await expect(createAttendance(testInput)).rejects.toThrow(/Booking with id 999 does not exist/i);
  });

  it('should handle different booking statuses', async () => {
    // Setup test data
    const user = await createTestUser();
    const instructor = await createTestInstructor();
    const testClass = await createTestClass(instructor.id);

    // Create cancelled booking
    const cancelledBooking = await db.insert(bookingsTable)
      .values({
        user_id: user.id,
        class_id: testClass.id,
        booking_status: 'cancelled',
        cancelled_at: new Date()
      })
      .returning()
      .execute();

    const testInput: CreateAttendanceInput = {
      booking_id: cancelledBooking[0].id,
      attended: false,
      notes: 'Booking was cancelled'
    };

    // Should still allow attendance record creation even for cancelled bookings
    const result = await createAttendance(testInput);

    expect(result.booking_id).toEqual(cancelledBooking[0].id);
    expect(result.attended).toEqual(false);
    expect(result.notes).toEqual('Booking was cancelled');
  });

  it('should set checked_in_at automatically when attended is true', async () => {
    // Setup test data
    const user = await createTestUser();
    const instructor = await createTestInstructor();
    const testClass = await createTestClass(instructor.id);
    const booking = await createTestBooking(user.id, testClass.id);

    const beforeTime = new Date();
    
    const testInput: CreateAttendanceInput = {
      booking_id: booking.id,
      attended: true
    };

    const result = await createAttendance(testInput);
    const afterTime = new Date();

    // Check that checked_in_at is set and within reasonable time bounds
    expect(result.checked_in_at).toBeInstanceOf(Date);
    expect(result.checked_in_at!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(result.checked_in_at!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });
});
