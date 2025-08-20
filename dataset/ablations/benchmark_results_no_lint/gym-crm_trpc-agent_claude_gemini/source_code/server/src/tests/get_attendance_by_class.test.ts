import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable, classesTable, bookingsTable, attendanceTable } from '../db/schema';
import { type GetBookingsByClassInput } from '../schema';
import { getAttendanceByClass } from '../handlers/get_attendance_by_class';

describe('getAttendanceByClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch attendance records for a specific class', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        name: 'Test Member',
        email: 'member@test.com',
        role: 'member'
      })
      .returning()
      .execute();

    // Create test instructor user
    const [instructorUser] = await db.insert(usersTable)
      .values({
        name: 'Test Instructor',
        email: 'instructor@test.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    // Create instructor profile
    const [instructor] = await db.insert(instructorsTable)
      .values({
        user_id: instructorUser.id,
        specialization: 'Yoga',
        bio: 'Experienced yoga instructor'
      })
      .returning()
      .execute();

    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'Relaxing morning yoga session',
        start_time: new Date('2024-01-15T09:00:00Z'),
        end_time: new Date('2024-01-15T10:00:00Z'),
        instructor_id: instructor.id,
        max_capacity: 20
      })
      .returning()
      .execute();

    // Create booking
    const [booking] = await db.insert(bookingsTable)
      .values({
        user_id: user.id,
        class_id: testClass.id,
        booking_status: 'confirmed'
      })
      .returning()
      .execute();

    // Create attendance record
    const checkinTime = new Date('2024-01-15T08:55:00Z');
    await db.insert(attendanceTable)
      .values({
        booking_id: booking.id,
        attended: true,
        checked_in_at: checkinTime,
        notes: 'Present and participated well'
      })
      .execute();

    // Test the handler
    const input: GetBookingsByClassInput = {
      class_id: testClass.id
    };

    const result = await getAttendanceByClass(input);

    expect(result).toHaveLength(1);
    expect(result[0].booking_id).toEqual(booking.id);
    expect(result[0].attended).toBe(true);
    expect(result[0].checked_in_at).toEqual(checkinTime);
    expect(result[0].notes).toEqual('Present and participated well');
    expect(result[0].id).toBeDefined();
  });

  it('should return multiple attendance records for a class with multiple bookings', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        { name: 'Member One', email: 'member1@test.com', role: 'member' as const },
        { name: 'Member Two', email: 'member2@test.com', role: 'member' as const }
      ])
      .returning()
      .execute();

    // Create instructor
    const [instructorUser] = await db.insert(usersTable)
      .values({
        name: 'Instructor',
        email: 'instructor@test.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const [instructor] = await db.insert(instructorsTable)
      .values({
        user_id: instructorUser.id,
        specialization: 'Pilates'
      })
      .returning()
      .execute();

    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Evening Pilates',
        start_time: new Date('2024-01-15T19:00:00Z'),
        end_time: new Date('2024-01-15T20:00:00Z'),
        instructor_id: instructor.id,
        max_capacity: 15
      })
      .returning()
      .execute();

    // Create bookings for both users
    const bookings = await db.insert(bookingsTable)
      .values([
        { user_id: users[0].id, class_id: testClass.id, booking_status: 'confirmed' as const },
        { user_id: users[1].id, class_id: testClass.id, booking_status: 'confirmed' as const }
      ])
      .returning()
      .execute();

    // Create attendance records - one attended, one did not
    await db.insert(attendanceTable)
      .values([
        {
          booking_id: bookings[0].id,
          attended: true,
          checked_in_at: new Date('2024-01-15T18:55:00Z'),
          notes: 'Great form today'
        },
        {
          booking_id: bookings[1].id,
          attended: false,
          checked_in_at: null,
          notes: 'No-show'
        }
      ])
      .execute();

    const input: GetBookingsByClassInput = {
      class_id: testClass.id
    };

    const result = await getAttendanceByClass(input);

    expect(result).toHaveLength(2);
    
    // Check both attendance records are present
    const attendedRecord = result.find(r => r.attended === true);
    const notAttendedRecord = result.find(r => r.attended === false);

    expect(attendedRecord).toBeDefined();
    expect(attendedRecord!.notes).toEqual('Great form today');
    expect(attendedRecord!.checked_in_at).toBeInstanceOf(Date);

    expect(notAttendedRecord).toBeDefined();
    expect(notAttendedRecord!.notes).toEqual('No-show');
    expect(notAttendedRecord!.checked_in_at).toBeNull();
  });

  it('should return empty array for class with no attendance records', async () => {
    // Create instructor and class but no bookings/attendance
    const [instructorUser] = await db.insert(usersTable)
      .values({
        name: 'Instructor',
        email: 'instructor@test.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const [instructor] = await db.insert(instructorsTable)
      .values({
        user_id: instructorUser.id,
        specialization: 'Dance'
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Dance Class',
        start_time: new Date('2024-01-20T10:00:00Z'),
        end_time: new Date('2024-01-20T11:00:00Z'),
        instructor_id: instructor.id,
        max_capacity: 25
      })
      .returning()
      .execute();

    const input: GetBookingsByClassInput = {
      class_id: testClass.id
    };

    const result = await getAttendanceByClass(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for class with bookings but no attendance records', async () => {
    // Create complete setup but no attendance
    const [user] = await db.insert(usersTable)
      .values({
        name: 'Test Member',
        email: 'member@test.com',
        role: 'member'
      })
      .returning()
      .execute();

    const [instructorUser] = await db.insert(usersTable)
      .values({
        name: 'Instructor',
        email: 'instructor@test.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const [instructor] = await db.insert(instructorsTable)
      .values({
        user_id: instructorUser.id,
        specialization: 'Cardio'
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Cardio Blast',
        start_time: new Date('2024-01-25T07:00:00Z'),
        end_time: new Date('2024-01-25T08:00:00Z'),
        instructor_id: instructor.id,
        max_capacity: 30
      })
      .returning()
      .execute();

    // Create booking but no attendance record
    await db.insert(bookingsTable)
      .values({
        user_id: user.id,
        class_id: testClass.id,
        booking_status: 'confirmed'
      })
      .execute();

    const input: GetBookingsByClassInput = {
      class_id: testClass.id
    };

    const result = await getAttendanceByClass(input);

    expect(result).toHaveLength(0);
  });

  it('should throw error for non-existent class', async () => {
    const input: GetBookingsByClassInput = {
      class_id: 99999
    };

    await expect(getAttendanceByClass(input)).rejects.toThrow(/Class with ID 99999 not found/i);
  });

  it('should handle attendance records with null values correctly', async () => {
    // Create complete setup
    const [user] = await db.insert(usersTable)
      .values({
        name: 'Test Member',
        email: 'member@test.com',
        role: 'member'
      })
      .returning()
      .execute();

    const [instructorUser] = await db.insert(usersTable)
      .values({
        name: 'Instructor',
        email: 'instructor@test.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const [instructor] = await db.insert(instructorsTable)
      .values({
        user_id: instructorUser.id,
        specialization: null,
        bio: null
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: null,
        start_time: new Date('2024-01-30T12:00:00Z'),
        end_time: new Date('2024-01-30T13:00:00Z'),
        instructor_id: instructor.id,
        max_capacity: 10
      })
      .returning()
      .execute();

    const [booking] = await db.insert(bookingsTable)
      .values({
        user_id: user.id,
        class_id: testClass.id,
        booking_status: 'confirmed'
      })
      .returning()
      .execute();

    // Create attendance with minimal data (nulls where allowed)
    await db.insert(attendanceTable)
      .values({
        booking_id: booking.id,
        attended: false,
        checked_in_at: null,
        notes: null
      })
      .execute();

    const input: GetBookingsByClassInput = {
      class_id: testClass.id
    };

    const result = await getAttendanceByClass(input);

    expect(result).toHaveLength(1);
    expect(result[0].attended).toBe(false);
    expect(result[0].checked_in_at).toBeNull();
    expect(result[0].notes).toBeNull();
    expect(result[0].booking_id).toEqual(booking.id);
  });
});
