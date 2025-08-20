import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, classesTable, bookingsTable } from '../db/schema';
import { cancelBooking } from '../handlers/cancel_booking';
import { eq } from 'drizzle-orm';

describe('cancelBooking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should cancel a booked booking and decrement class count', async () => {
    // Create prerequisite member
    const memberResults = await db.insert(membersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: null,
        membership_type: 'basic',
        status: 'active'
      })
      .returning()
      .execute();
    
    const memberId = memberResults[0].id;

    // Create prerequisite class with current bookings count
    const classResults = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class',
        instructor_name: 'Jane Smith',
        duration_minutes: 60,
        max_capacity: 20,
        current_bookings: 1, // Set to 1 since we'll add a booking
        class_date: '2024-02-15',
        start_time: '10:00',
        status: 'scheduled'
      })
      .returning()
      .execute();
    
    const classId = classResults[0].id;

    // Create a booking with 'booked' status
    const bookingResults = await db.insert(bookingsTable)
      .values({
        member_id: memberId,
        class_id: classId,
        status: 'booked'
      })
      .returning()
      .execute();
    
    const bookingId = bookingResults[0].id;

    // Cancel the booking
    const result = await cancelBooking(bookingId);

    // Verify booking status is updated to 'cancelled'
    expect(result.id).toEqual(bookingId);
    expect(result.status).toEqual('cancelled');
    expect(result.member_id).toEqual(memberId);
    expect(result.class_id).toEqual(classId);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify the booking is updated in database
    const updatedBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .execute();
    
    expect(updatedBookings[0].status).toEqual('cancelled');

    // Verify class current_bookings count is decremented
    const updatedClasses = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();
    
    expect(updatedClasses[0].current_bookings).toEqual(0);
  });

  it('should cancel a no_show booking and decrement class count', async () => {
    // Create prerequisite member
    const memberResults = await db.insert(membersTable)
      .values({
        email: 'test2@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '123-456-7890',
        membership_type: 'premium',
        status: 'active'
      })
      .returning()
      .execute();
    
    const memberId = memberResults[0].id;

    // Create prerequisite class
    const classResults = await db.insert(classesTable)
      .values({
        name: 'Yoga Class',
        description: 'Relaxing yoga session',
        instructor_name: 'Mary Johnson',
        duration_minutes: 90,
        max_capacity: 15,
        current_bookings: 3,
        class_date: '2024-02-16',
        start_time: '09:00',
        status: 'scheduled'
      })
      .returning()
      .execute();
    
    const classId = classResults[0].id;

    // Create a booking with 'no_show' status
    const bookingResults = await db.insert(bookingsTable)
      .values({
        member_id: memberId,
        class_id: classId,
        status: 'no_show'
      })
      .returning()
      .execute();
    
    const bookingId = bookingResults[0].id;

    // Cancel the booking
    const result = await cancelBooking(bookingId);

    // Verify booking is cancelled
    expect(result.status).toEqual('cancelled');

    // Verify class current_bookings count is decremented from 3 to 2
    const updatedClasses = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();
    
    expect(updatedClasses[0].current_bookings).toEqual(2);
  });

  it('should return already cancelled booking without changes', async () => {
    // Create prerequisite member
    const memberResults = await db.insert(membersTable)
      .values({
        email: 'test3@example.com',
        first_name: 'Bob',
        last_name: 'Smith',
        phone: null,
        membership_type: 'vip',
        status: 'active'
      })
      .returning()
      .execute();
    
    const memberId = memberResults[0].id;

    // Create prerequisite class
    const classResults = await db.insert(classesTable)
      .values({
        name: 'Pilates Class',
        description: null,
        instructor_name: 'Sarah Wilson',
        duration_minutes: 45,
        max_capacity: 10,
        current_bookings: 2,
        class_date: '2024-02-17',
        start_time: '18:00',
        status: 'scheduled'
      })
      .returning()
      .execute();
    
    const classId = classResults[0].id;

    // Create a booking already cancelled
    const bookingResults = await db.insert(bookingsTable)
      .values({
        member_id: memberId,
        class_id: classId,
        status: 'cancelled'
      })
      .returning()
      .execute();
    
    const bookingId = bookingResults[0].id;

    // Try to cancel the already cancelled booking
    const result = await cancelBooking(bookingId);

    // Verify booking remains cancelled
    expect(result.status).toEqual('cancelled');

    // Verify class current_bookings count remains unchanged
    const updatedClasses = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();
    
    expect(updatedClasses[0].current_bookings).toEqual(2);
  });

  it('should throw error when trying to cancel attended booking', async () => {
    // Create prerequisite member
    const memberResults = await db.insert(membersTable)
      .values({
        email: 'test4@example.com',
        first_name: 'Alice',
        last_name: 'Brown',
        phone: '987-654-3210',
        membership_type: 'basic',
        status: 'active'
      })
      .returning()
      .execute();
    
    const memberId = memberResults[0].id;

    // Create prerequisite class
    const classResults = await db.insert(classesTable)
      .values({
        name: 'Spin Class',
        description: 'High intensity cycling',
        instructor_name: 'Mike Davis',
        duration_minutes: 50,
        max_capacity: 25,
        current_bookings: 5,
        class_date: '2024-02-18',
        start_time: '07:00',
        status: 'completed'
      })
      .returning()
      .execute();
    
    const classId = classResults[0].id;

    // Create a booking with 'attended' status
    const bookingResults = await db.insert(bookingsTable)
      .values({
        member_id: memberId,
        class_id: classId,
        status: 'attended'
      })
      .returning()
      .execute();
    
    const bookingId = bookingResults[0].id;

    // Try to cancel the attended booking - should throw error
    await expect(cancelBooking(bookingId)).rejects.toThrow(/cannot cancel.*attended/i);

    // Verify class current_bookings count remains unchanged
    const updatedClasses = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();
    
    expect(updatedClasses[0].current_bookings).toEqual(5);
  });

  it('should throw error when booking does not exist', async () => {
    const nonExistentBookingId = 999999;

    await expect(cancelBooking(nonExistentBookingId)).rejects.toThrow(/booking not found/i);
  });
});
