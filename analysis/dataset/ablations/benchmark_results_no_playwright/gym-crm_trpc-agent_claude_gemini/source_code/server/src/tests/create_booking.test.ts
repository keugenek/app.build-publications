import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, classesTable, classSchedulesTable, bookingsTable } from '../db/schema';
import { type CreateBookingInput } from '../schema';
import { createBooking } from '../handlers/create_booking';
import { eq, and } from 'drizzle-orm';

describe('createBooking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test member
  const createTestMember = async () => {
    const result = await db.insert(membersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-1234',
        membership_type: 'basic',
        membership_start_date: '2024-01-01',
        membership_end_date: '2024-12-31',
        is_active: true
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create test class
  const createTestClass = async () => {
    const result = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'Relaxing morning yoga session',
        instructor_name: 'Jane Smith',
        duration_minutes: 60,
        max_capacity: 20,
        class_type: 'yoga',
        difficulty_level: 'beginner',
        is_active: true
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create test class schedule
  const createTestClassSchedule = async (classId: number, currentBookings = 0) => {
    const result = await db.insert(classSchedulesTable)
      .values({
        class_id: classId,
        scheduled_date: '2024-12-25',
        start_time: '09:00',
        end_time: '10:00',
        current_bookings: currentBookings,
        is_cancelled: false
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a booking successfully', async () => {
    const member = await createTestMember();
    const classInfo = await createTestClass();
    const schedule = await createTestClassSchedule(classInfo.id);

    const input: CreateBookingInput = {
      member_id: member.id,
      class_schedule_id: schedule.id
    };

    const result = await createBooking(input);

    // Validate booking properties
    expect(result.id).toBeDefined();
    expect(result.member_id).toBe(member.id);
    expect(result.class_schedule_id).toBe(schedule.id);
    expect(result.booking_status).toBe('booked');
    expect(result.booking_date).toBeInstanceOf(Date);
    expect(result.cancellation_date).toBeNull();
    expect(result.attendance_marked_at).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save booking to database', async () => {
    const member = await createTestMember();
    const classInfo = await createTestClass();
    const schedule = await createTestClassSchedule(classInfo.id);

    const input: CreateBookingInput = {
      member_id: member.id,
      class_schedule_id: schedule.id
    };

    const result = await createBooking(input);

    // Verify booking exists in database
    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, result.id))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].member_id).toBe(member.id);
    expect(bookings[0].class_schedule_id).toBe(schedule.id);
    expect(bookings[0].booking_status).toBe('booked');
  });

  it('should increment current_bookings count on class schedule', async () => {
    const member = await createTestMember();
    const classInfo = await createTestClass();
    const schedule = await createTestClassSchedule(classInfo.id, 5);

    const input: CreateBookingInput = {
      member_id: member.id,
      class_schedule_id: schedule.id
    };

    await createBooking(input);

    // Verify current_bookings was incremented
    const updatedSchedule = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, schedule.id))
      .execute();

    expect(updatedSchedule[0].current_bookings).toBe(6);
  });

  it('should throw error when member does not exist', async () => {
    const classInfo = await createTestClass();
    const schedule = await createTestClassSchedule(classInfo.id);

    const input: CreateBookingInput = {
      member_id: 999, // Non-existent member
      class_schedule_id: schedule.id
    };

    await expect(createBooking(input)).rejects.toThrow(/member not found/i);
  });

  it('should throw error when member is not active', async () => {
    // Create inactive member
    const inactiveMember = await db.insert(membersTable)
      .values({
        first_name: 'Inactive',
        last_name: 'User',
        email: 'inactive@example.com',
        phone: null,
        membership_type: 'basic',
        membership_start_date: '2024-01-01',
        membership_end_date: '2024-12-31',
        is_active: false
      })
      .returning()
      .execute();

    const classInfo = await createTestClass();
    const schedule = await createTestClassSchedule(classInfo.id);

    const input: CreateBookingInput = {
      member_id: inactiveMember[0].id,
      class_schedule_id: schedule.id
    };

    await expect(createBooking(input)).rejects.toThrow(/member is not active/i);
  });

  it('should throw error when class schedule does not exist', async () => {
    const member = await createTestMember();

    const input: CreateBookingInput = {
      member_id: member.id,
      class_schedule_id: 999 // Non-existent schedule
    };

    await expect(createBooking(input)).rejects.toThrow(/class schedule not found/i);
  });

  it('should throw error when class schedule is cancelled', async () => {
    const member = await createTestMember();
    const classInfo = await createTestClass();
    
    // Create cancelled schedule
    const cancelledSchedule = await db.insert(classSchedulesTable)
      .values({
        class_id: classInfo.id,
        scheduled_date: '2024-12-25',
        start_time: '09:00',
        end_time: '10:00',
        current_bookings: 0,
        is_cancelled: true,
        cancellation_reason: 'Instructor unavailable'
      })
      .returning()
      .execute();

    const input: CreateBookingInput = {
      member_id: member.id,
      class_schedule_id: cancelledSchedule[0].id
    };

    await expect(createBooking(input)).rejects.toThrow(/class schedule is cancelled/i);
  });

  it('should throw error when class is not active', async () => {
    const member = await createTestMember();
    
    // Create inactive class
    const inactiveClass = await db.insert(classesTable)
      .values({
        name: 'Inactive Class',
        description: 'This class is not active',
        instructor_name: 'Test Instructor',
        duration_minutes: 45,
        max_capacity: 15,
        class_type: 'cardio',
        difficulty_level: 'intermediate',
        is_active: false
      })
      .returning()
      .execute();

    const schedule = await createTestClassSchedule(inactiveClass[0].id);

    const input: CreateBookingInput = {
      member_id: member.id,
      class_schedule_id: schedule.id
    };

    await expect(createBooking(input)).rejects.toThrow(/class is not active/i);
  });

  it('should throw error when class is full', async () => {
    const member = await createTestMember();
    const classInfo = await createTestClass();
    // Create schedule with current_bookings equal to max_capacity
    const fullSchedule = await createTestClassSchedule(classInfo.id, classInfo.max_capacity);

    const input: CreateBookingInput = {
      member_id: member.id,
      class_schedule_id: fullSchedule.id
    };

    await expect(createBooking(input)).rejects.toThrow(/class is full/i);
  });

  it('should throw error when member already has a booking for the same class schedule', async () => {
    const member = await createTestMember();
    const classInfo = await createTestClass();
    const schedule = await createTestClassSchedule(classInfo.id);

    // Create existing booking
    await db.insert(bookingsTable)
      .values({
        member_id: member.id,
        class_schedule_id: schedule.id,
        booking_status: 'booked'
      })
      .execute();

    const input: CreateBookingInput = {
      member_id: member.id,
      class_schedule_id: schedule.id
    };

    await expect(createBooking(input)).rejects.toThrow(/member already has a booking/i);
  });

  it('should allow booking when member has cancelled booking for same class schedule', async () => {
    const member = await createTestMember();
    const classInfo = await createTestClass();
    const schedule = await createTestClassSchedule(classInfo.id);

    // Create cancelled booking (should not prevent new booking)
    await db.insert(bookingsTable)
      .values({
        member_id: member.id,
        class_schedule_id: schedule.id,
        booking_status: 'cancelled'
      })
      .execute();

    const input: CreateBookingInput = {
      member_id: member.id,
      class_schedule_id: schedule.id
    };

    const result = await createBooking(input);
    expect(result.booking_status).toBe('booked');
  });

  it('should handle multiple bookings for different members on same class schedule', async () => {
    // Create two members
    const member1 = await createTestMember();
    const member2 = await db.insert(membersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '555-5678',
        membership_type: 'premium',
        membership_start_date: '2024-01-01',
        membership_end_date: '2024-12-31',
        is_active: true
      })
      .returning()
      .execute();

    const classInfo = await createTestClass();
    const schedule = await createTestClassSchedule(classInfo.id);

    const input1: CreateBookingInput = {
      member_id: member1.id,
      class_schedule_id: schedule.id
    };

    const input2: CreateBookingInput = {
      member_id: member2[0].id,
      class_schedule_id: schedule.id
    };

    // Both bookings should succeed
    const result1 = await createBooking(input1);
    const result2 = await createBooking(input2);

    expect(result1.member_id).toBe(member1.id);
    expect(result2.member_id).toBe(member2[0].id);
    expect(result1.class_schedule_id).toBe(schedule.id);
    expect(result2.class_schedule_id).toBe(schedule.id);

    // Verify current_bookings was incremented twice
    const updatedSchedule = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, schedule.id))
      .execute();

    expect(updatedSchedule[0].current_bookings).toBe(2);
  });
});
