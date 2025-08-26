import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, classesTable, bookingsTable } from '../db/schema';
import { type CreateBookingInput } from '../schema';
import { createBooking } from '../handlers/create_booking';
import { eq, and } from 'drizzle-orm';

// Test data setup
const testMember = {
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  phone: null,
  membership_type: 'basic' as const,
  status: 'active' as const
};

const testClass = {
  name: 'Test Yoga Class',
  description: 'A relaxing yoga session',
  instructor_name: 'Jane Instructor',
  duration_minutes: 60,
  max_capacity: 20,
  current_bookings: 5,
  class_date: '2024-12-15',
  start_time: '10:00',
  status: 'scheduled' as const
};

const testInput: CreateBookingInput = {
  member_id: 1, // Will be updated with actual ID
  class_id: 1,  // Will be updated with actual ID
  status: 'booked'
};

describe('createBooking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a booking successfully', async () => {
    // Create prerequisites
    const memberResult = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();
    const member = memberResult[0];

    const classResult = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();
    const classData = classResult[0];

    const input: CreateBookingInput = {
      member_id: member.id,
      class_id: classData.id,
      status: 'booked'
    };

    const result = await createBooking(input);

    // Verify booking details
    expect(result.member_id).toEqual(member.id);
    expect(result.class_id).toEqual(classData.id);
    expect(result.status).toEqual('booked');
    expect(result.id).toBeDefined();
    expect(result.booked_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save booking to database', async () => {
    // Create prerequisites
    const memberResult = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();
    const member = memberResult[0];

    const classResult = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();
    const classData = classResult[0];

    const input: CreateBookingInput = {
      member_id: member.id,
      class_id: classData.id,
      status: 'booked'
    };

    const result = await createBooking(input);

    // Verify booking was saved to database
    const savedBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, result.id))
      .execute();

    expect(savedBookings).toHaveLength(1);
    expect(savedBookings[0].member_id).toEqual(member.id);
    expect(savedBookings[0].class_id).toEqual(classData.id);
    expect(savedBookings[0].status).toEqual('booked');
  });

  it('should increment class current_bookings count', async () => {
    // Create prerequisites
    const memberResult = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();
    const member = memberResult[0];

    const classResult = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();
    const classData = classResult[0];

    const input: CreateBookingInput = {
      member_id: member.id,
      class_id: classData.id,
      status: 'booked'
    };

    const initialBookings = classData.current_bookings;
    await createBooking(input);

    // Verify class current_bookings was incremented
    const updatedClass = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classData.id))
      .execute();

    expect(updatedClass[0].current_bookings).toEqual(initialBookings + 1);
    expect(updatedClass[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when member does not exist', async () => {
    // Create class but no member
    const classResult = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();
    const classData = classResult[0];

    const input: CreateBookingInput = {
      member_id: 999, // Non-existent member ID
      class_id: classData.id,
      status: 'booked'
    };

    await expect(createBooking(input)).rejects.toThrow(/Member with ID 999 not found/i);
  });

  it('should throw error when class does not exist', async () => {
    // Create member but no class
    const memberResult = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();
    const member = memberResult[0];

    const input: CreateBookingInput = {
      member_id: member.id,
      class_id: 999, // Non-existent class ID
      status: 'booked'
    };

    await expect(createBooking(input)).rejects.toThrow(/Class with ID 999 not found/i);
  });

  it('should throw error when class is at full capacity', async () => {
    // Create prerequisites
    const memberResult = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();
    const member = memberResult[0];

    // Create class at full capacity
    const fullClass = {
      ...testClass,
      max_capacity: 5,
      current_bookings: 5 // At capacity
    };

    const classResult = await db.insert(classesTable)
      .values(fullClass)
      .returning()
      .execute();
    const classData = classResult[0];

    const input: CreateBookingInput = {
      member_id: member.id,
      class_id: classData.id,
      status: 'booked'
    };

    await expect(createBooking(input)).rejects.toThrow(/Class is at full capacity/i);
  });

  it('should throw error when class is completed', async () => {
    // Create prerequisites
    const memberResult = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();
    const member = memberResult[0];

    const completedClass = {
      ...testClass,
      status: 'completed' as const
    };

    const classResult = await db.insert(classesTable)
      .values(completedClass)
      .returning()
      .execute();
    const classData = classResult[0];

    const input: CreateBookingInput = {
      member_id: member.id,
      class_id: classData.id,
      status: 'booked'
    };

    await expect(createBooking(input)).rejects.toThrow(/Cannot book a class that is completed or cancelled/i);
  });

  it('should throw error when class is cancelled', async () => {
    // Create prerequisites
    const memberResult = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();
    const member = memberResult[0];

    const cancelledClass = {
      ...testClass,
      status: 'cancelled' as const
    };

    const classResult = await db.insert(classesTable)
      .values(cancelledClass)
      .returning()
      .execute();
    const classData = classResult[0];

    const input: CreateBookingInput = {
      member_id: member.id,
      class_id: classData.id,
      status: 'booked'
    };

    await expect(createBooking(input)).rejects.toThrow(/Cannot book a class that is completed or cancelled/i);
  });

  it('should throw error when member already has booking for the class', async () => {
    // Create prerequisites
    const memberResult = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();
    const member = memberResult[0];

    const classResult = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();
    const classData = classResult[0];

    // Create existing booking
    await db.insert(bookingsTable)
      .values({
        member_id: member.id,
        class_id: classData.id,
        status: 'booked',
        booked_at: new Date()
      })
      .execute();

    const input: CreateBookingInput = {
      member_id: member.id,
      class_id: classData.id,
      status: 'booked'
    };

    await expect(createBooking(input)).rejects.toThrow(/Member already has a booking for this class/i);
  });

  it('should allow booking with different status values', async () => {
    // Create prerequisites
    const memberResult = await db.insert(membersTable)
      .values(testMember)
      .returning()
      .execute();
    const member = memberResult[0];

    const classResult = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();
    const classData = classResult[0];

    const input: CreateBookingInput = {
      member_id: member.id,
      class_id: classData.id,
      status: 'attended' // Different status
    };

    const result = await createBooking(input);

    expect(result.status).toEqual('attended');
    expect(result.member_id).toEqual(member.id);
    expect(result.class_id).toEqual(classData.id);
  });
});
