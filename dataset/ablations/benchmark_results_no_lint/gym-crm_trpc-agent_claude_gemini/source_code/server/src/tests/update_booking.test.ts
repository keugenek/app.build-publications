import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable, classesTable, bookingsTable } from '../db/schema';
import { type UpdateBookingInput } from '../schema';
import { updateBooking } from '../handlers/update_booking';
import { eq, and } from 'drizzle-orm';

describe('updateBooking', () => {
  let testUser: any;
  let testInstructor: any;
  let testClass: any;
  let testBooking: any;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const users = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'member'
      })
      .returning()
      .execute();
    testUser = users[0];

    // Create instructor user
    const instructorUsers = await db.insert(usersTable)
      .values({
        name: 'Test Instructor',
        email: 'instructor@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    // Create instructor record
    const instructors = await db.insert(instructorsTable)
      .values({
        user_id: instructorUsers[0].id,
        specialization: 'Yoga',
        bio: 'Experienced yoga instructor'
      })
      .returning()
      .execute();
    testInstructor = instructors[0];

    // Create test class
    const startTime = new Date('2024-03-15T10:00:00Z');
    const endTime = new Date('2024-03-15T11:00:00Z');
    
    const classes = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'A relaxing morning yoga session',
        start_time: startTime,
        end_time: endTime,
        instructor_id: testInstructor.id,
        max_capacity: 2
      })
      .returning()
      .execute();
    testClass = classes[0];

    // Create test booking
    const bookings = await db.insert(bookingsTable)
      .values({
        user_id: testUser.id,
        class_id: testClass.id,
        booking_status: 'confirmed'
      })
      .returning()
      .execute();
    testBooking = bookings[0];
  });

  afterEach(resetDB);

  it('should update booking status to cancelled', async () => {
    const input: UpdateBookingInput = {
      id: testBooking.id,
      booking_status: 'cancelled'
    };

    const result = await updateBooking(input);

    expect(result.id).toEqual(testBooking.id);
    expect(result.booking_status).toEqual('cancelled');
    expect(result.cancelled_at).toBeInstanceOf(Date);
    expect(result.user_id).toEqual(testUser.id);
    expect(result.class_id).toEqual(testClass.id);
  });

  it('should update booking status to waitlist', async () => {
    const input: UpdateBookingInput = {
      id: testBooking.id,
      booking_status: 'waitlist'
    };

    const result = await updateBooking(input);

    expect(result.booking_status).toEqual('waitlist');
    expect(result.cancelled_at).toBeNull();
  });

  it('should clear cancelled_at when confirming a previously cancelled booking', async () => {
    // First cancel the booking
    await updateBooking({
      id: testBooking.id,
      booking_status: 'cancelled'
    });

    // Then confirm it again
    const input: UpdateBookingInput = {
      id: testBooking.id,
      booking_status: 'confirmed'
    };

    const result = await updateBooking(input);

    expect(result.booking_status).toEqual('confirmed');
    expect(result.cancelled_at).toBeNull();
  });

  it('should save updated booking to database', async () => {
    const input: UpdateBookingInput = {
      id: testBooking.id,
      booking_status: 'cancelled'
    };

    await updateBooking(input);

    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, testBooking.id))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].booking_status).toEqual('cancelled');
    expect(bookings[0].cancelled_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent booking', async () => {
    const input: UpdateBookingInput = {
      id: 999999,
      booking_status: 'cancelled'
    };

    await expect(updateBooking(input)).rejects.toThrow(/not found/i);
  });

  it('should promote waitlisted booking when confirmed booking is cancelled', async () => {
    // Create a second user
    const secondUser = await db.insert(usersTable)
      .values({
        name: 'Second User',
        email: 'second@example.com',
        role: 'member'
      })
      .returning()
      .execute();

    // Create a third user
    const thirdUser = await db.insert(usersTable)
      .values({
        name: 'Third User',
        email: 'third@example.com',
        role: 'member'
      })
      .returning()
      .execute();

    // Fill up the class capacity (max_capacity = 2)
    const secondBooking = await db.insert(bookingsTable)
      .values({
        user_id: secondUser[0].id,
        class_id: testClass.id,
        booking_status: 'confirmed'
      })
      .returning()
      .execute();

    // Create a waitlisted booking
    const waitlistBooking = await db.insert(bookingsTable)
      .values({
        user_id: thirdUser[0].id,
        class_id: testClass.id,
        booking_status: 'waitlist'
      })
      .returning()
      .execute();

    // Cancel one confirmed booking
    await updateBooking({
      id: testBooking.id,
      booking_status: 'cancelled'
    });

    // Check that the waitlisted booking was promoted
    const updatedWaitlistBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, waitlistBooking[0].id))
      .execute();

    expect(updatedWaitlistBooking[0].booking_status).toEqual('confirmed');
  });

  it('should promote oldest waitlisted booking first (FIFO)', async () => {
    // Create additional users
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'User 2',
          email: 'user2@example.com',
          role: 'member'
        },
        {
          name: 'User 3',
          email: 'user3@example.com',
          role: 'member'
        },
        {
          name: 'User 4',
          email: 'user4@example.com',
          role: 'member'
        }
      ])
      .returning()
      .execute();

    // Fill up the class capacity
    await db.insert(bookingsTable)
      .values({
        user_id: users[0].id,
        class_id: testClass.id,
        booking_status: 'confirmed'
      })
      .execute();

    // Create waitlisted bookings with slight time differences
    const firstWaitlistBooking = await db.insert(bookingsTable)
      .values({
        user_id: users[1].id,
        class_id: testClass.id,
        booking_status: 'waitlist'
      })
      .returning()
      .execute();

    // Wait a moment and create second waitlist booking
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondWaitlistBooking = await db.insert(bookingsTable)
      .values({
        user_id: users[2].id,
        class_id: testClass.id,
        booking_status: 'waitlist'
      })
      .returning()
      .execute();

    // Cancel a confirmed booking to free up space
    await updateBooking({
      id: testBooking.id,
      booking_status: 'cancelled'
    });

    // Check that the first (oldest) waitlisted booking was promoted
    const firstBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, firstWaitlistBooking[0].id))
      .execute();

    const secondBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, secondWaitlistBooking[0].id))
      .execute();

    expect(firstBooking[0].booking_status).toEqual('confirmed');
    expect(secondBooking[0].booking_status).toEqual('waitlist');
  });

  it('should not promote waitlist if class is still at capacity', async () => {
    // Create a second user and confirmed booking
    const secondUser = await db.insert(usersTable)
      .values({
        name: 'Second User',
        email: 'second@example.com',
        role: 'member'
      })
      .returning()
      .execute();

    await db.insert(bookingsTable)
      .values({
        user_id: secondUser[0].id,
        class_id: testClass.id,
        booking_status: 'confirmed'
      })
      .execute();

    // Create a third user and waitlisted booking
    const thirdUser = await db.insert(usersTable)
      .values({
        name: 'Third User',
        email: 'third@example.com',
        role: 'member'
      })
      .returning()
      .execute();

    const waitlistBooking = await db.insert(bookingsTable)
      .values({
        user_id: thirdUser[0].id,
        class_id: testClass.id,
        booking_status: 'waitlist'
      })
      .returning()
      .execute();

    // Change status to waitlist (not cancelling, so capacity stays full)
    await updateBooking({
      id: testBooking.id,
      booking_status: 'waitlist'
    });

    // Check that the waitlisted booking remains on waitlist
    const bookingAfterUpdate = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, waitlistBooking[0].id))
      .execute();

    expect(bookingAfterUpdate[0].booking_status).toEqual('waitlist');
  });
});
