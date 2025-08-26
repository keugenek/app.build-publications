import { db } from '../db';
import { bookingsTable, membersTable, classSchedulesTable, classesTable } from '../db/schema';
import { type CreateBookingInput, type Booking } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createBooking = async (input: CreateBookingInput): Promise<Booking> => {
  try {
    // Verify member exists and is active
    const member = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, input.member_id))
      .execute();

    if (!member.length) {
      throw new Error('Member not found');
    }

    if (!member[0].is_active) {
      throw new Error('Member is not active');
    }

    // Get class schedule with class details
    const scheduleWithClass = await db.select()
      .from(classSchedulesTable)
      .innerJoin(classesTable, eq(classSchedulesTable.class_id, classesTable.id))
      .where(eq(classSchedulesTable.id, input.class_schedule_id))
      .execute();

    if (!scheduleWithClass.length) {
      throw new Error('Class schedule not found');
    }

    const schedule = scheduleWithClass[0].class_schedules;
    const classInfo = scheduleWithClass[0].classes;

    // Check if class schedule is cancelled
    if (schedule.is_cancelled) {
      throw new Error('Class schedule is cancelled');
    }

    // Check if class is active
    if (!classInfo.is_active) {
      throw new Error('Class is not active');
    }

    // Check if class is full
    if (schedule.current_bookings >= classInfo.max_capacity) {
      throw new Error('Class is full');
    }

    // Check for existing booking for this member and class schedule
    const existingBooking = await db.select()
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.member_id, input.member_id),
          eq(bookingsTable.class_schedule_id, input.class_schedule_id),
          eq(bookingsTable.booking_status, 'booked')
        )
      )
      .execute();

    if (existingBooking.length) {
      throw new Error('Member already has a booking for this class schedule');
    }

    // Create the booking
    const result = await db.insert(bookingsTable)
      .values({
        member_id: input.member_id,
        class_schedule_id: input.class_schedule_id,
        booking_status: 'booked'
      })
      .returning()
      .execute();

    // Increment current_bookings count on the class schedule
    await db.update(classSchedulesTable)
      .set({
        current_bookings: schedule.current_bookings + 1,
        updated_at: new Date()
      })
      .where(eq(classSchedulesTable.id, input.class_schedule_id))
      .execute();

    return result[0];
  } catch (error) {
    console.error('Booking creation failed:', error);
    throw error;
  }
};
