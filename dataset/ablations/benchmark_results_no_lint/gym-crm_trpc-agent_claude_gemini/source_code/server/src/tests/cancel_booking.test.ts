import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, instructorsTable, classesTable, bookingsTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { cancelBooking } from '../handlers/cancel_booking';
import { eq } from 'drizzle-orm';

describe('cancelBooking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'member'
      })
      .returning()
      .execute();
    
    const user = users[0];

    // Create instructor user
    const instructorUsers = await db.insert(usersTable)
      .values({
        name: 'Test Instructor',
        email: 'instructor@example.com',
        role: 'instructor'
      })
      .returning()
      .execute();

    const instructorUser = instructorUsers[0];

    // Create instructor record
    const instructors = await db.insert(instructorsTable)
      .values({
        user_id: instructorUser.id,
        specialization: 'Yoga',
        bio: 'Experienced yoga instructor'
      })
      .returning()
      .execute();

    const instructor = instructors[0];

    // Create test class
    const classes = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'A relaxing morning yoga session',
        start_time: new Date('2024-01-15 09:00:00'),
        end_time: new Date('2024-01-15 10:00:00'),
        instructor_id: instructor.id,
        max_capacity: 10
      })
      .returning()
      .execute();

    const testClass = classes[0];

    return { user, instructor, testClass };
  };

  it('should cancel a confirmed booking', async () => {
    const { user, testClass } = await createTestData();

    // Create a confirmed booking
    const bookings = await db.insert(bookingsTable)
      .values({
        user_id: user.id,
        class_id: testClass.id,
        booking_status: 'confirmed'
      })
      .returning()
      .execute();

    const booking = bookings[0];

    const input: DeleteEntityInput = { id: booking.id };
    const result = await cancelBooking(input);

    // Verify booking is cancelled
    expect(result.id).toEqual(booking.id);
    expect(result.booking_status).toEqual('cancelled');
    expect(result.cancelled_at).toBeInstanceOf(Date);
    expect(result.user_id).toEqual(user.id);
    expect(result.class_id).toEqual(testClass.id);
  });

  it('should update booking in database when cancelled', async () => {
    const { user, testClass } = await createTestData();

    // Create a confirmed booking
    const bookings = await db.insert(bookingsTable)
      .values({
        user_id: user.id,
        class_id: testClass.id,
        booking_status: 'confirmed'
      })
      .returning()
      .execute();

    const booking = bookings[0];

    const input: DeleteEntityInput = { id: booking.id };
    await cancelBooking(input);

    // Query database to verify the booking was updated
    const updatedBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, booking.id))
      .execute();

    expect(updatedBookings).toHaveLength(1);
    const updatedBooking = updatedBookings[0];
    expect(updatedBooking.booking_status).toEqual('cancelled');
    expect(updatedBooking.cancelled_at).toBeInstanceOf(Date);
  });

  it('should promote waitlisted member when confirmed booking is cancelled', async () => {
    const { testClass } = await createTestData();

    // Create additional users
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'Member 1',
          email: 'member1@example.com',
          role: 'member'
        },
        {
          name: 'Member 2',
          email: 'member2@example.com',
          role: 'member'
        }
      ])
      .returning()
      .execute();

    const [user1, user2] = users;

    // Create one confirmed booking and one waitlisted booking
    const bookings = await db.insert(bookingsTable)
      .values([
        {
          user_id: user1.id,
          class_id: testClass.id,
          booking_status: 'confirmed'
        },
        {
          user_id: user2.id,
          class_id: testClass.id,
          booking_status: 'waitlist'
        }
      ])
      .returning()
      .execute();

    const [confirmedBooking, waitlistedBooking] = bookings;

    // Cancel the confirmed booking
    const input: DeleteEntityInput = { id: confirmedBooking.id };
    await cancelBooking(input);

    // Check that the waitlisted booking was promoted to confirmed
    const promotedBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, waitlistedBooking.id))
      .execute();

    expect(promotedBookings).toHaveLength(1);
    expect(promotedBookings[0].booking_status).toEqual('confirmed');
  });

  it('should promote earliest waitlisted member when multiple are waiting', async () => {
    const { testClass } = await createTestData();

    // Create additional users
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'Member 1',
          email: 'member1@example.com',
          role: 'member'
        },
        {
          name: 'Member 2',
          email: 'member2@example.com',
          role: 'member'
        },
        {
          name: 'Member 3',
          email: 'member3@example.com',
          role: 'member'
        }
      ])
      .returning()
      .execute();

    const [user1, user2, user3] = users;

    // Create bookings with specific timestamps to test ordering
    const now = new Date();
    const earlier = new Date(now.getTime() - 10000); // 10 seconds earlier
    const later = new Date(now.getTime() + 10000); // 10 seconds later

    const bookings = await db.insert(bookingsTable)
      .values([
        {
          user_id: user1.id,
          class_id: testClass.id,
          booking_status: 'confirmed'
        },
        {
          user_id: user2.id,
          class_id: testClass.id,
          booking_status: 'waitlist',
          booked_at: later // This one joined the waitlist later
        },
        {
          user_id: user3.id,
          class_id: testClass.id,
          booking_status: 'waitlist',
          booked_at: earlier // This one joined the waitlist earlier
        }
      ])
      .returning()
      .execute();

    const [confirmedBooking, laterWaitlistBooking, earlierWaitlistBooking] = bookings;

    // Cancel the confirmed booking
    const input: DeleteEntityInput = { id: confirmedBooking.id };
    await cancelBooking(input);

    // Check that the earlier waitlisted booking was promoted
    const promotedBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, earlierWaitlistBooking.id))
      .execute();

    const stillWaitingBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, laterWaitlistBooking.id))
      .execute();

    expect(promotedBookings[0].booking_status).toEqual('confirmed');
    expect(stillWaitingBookings[0].booking_status).toEqual('waitlist');
  });

  it('should not promote anyone when cancelling a waitlisted booking', async () => {
    const { user, testClass } = await createTestData();

    // Create a waitlisted booking
    const bookings = await db.insert(bookingsTable)
      .values({
        user_id: user.id,
        class_id: testClass.id,
        booking_status: 'waitlist'
      })
      .returning()
      .execute();

    const booking = bookings[0];

    const input: DeleteEntityInput = { id: booking.id };
    const result = await cancelBooking(input);

    // Verify booking is cancelled
    expect(result.booking_status).toEqual('cancelled');
    expect(result.cancelled_at).toBeInstanceOf(Date);

    // Verify no other bookings were affected (there shouldn't be any others)
    const allBookings = await db.select()
      .from(bookingsTable)
      .execute();

    expect(allBookings).toHaveLength(1);
    expect(allBookings[0].booking_status).toEqual('cancelled');
  });

  it('should throw error when booking does not exist', async () => {
    const input: DeleteEntityInput = { id: 999 };

    expect(cancelBooking(input)).rejects.toThrow(/not found/i);
  });

  it('should throw error when booking is already cancelled', async () => {
    const { user, testClass } = await createTestData();

    // Create an already cancelled booking
    const bookings = await db.insert(bookingsTable)
      .values({
        user_id: user.id,
        class_id: testClass.id,
        booking_status: 'cancelled',
        cancelled_at: new Date()
      })
      .returning()
      .execute();

    const booking = bookings[0];

    const input: DeleteEntityInput = { id: booking.id };

    expect(cancelBooking(input)).rejects.toThrow(/already cancelled/i);
  });
});
