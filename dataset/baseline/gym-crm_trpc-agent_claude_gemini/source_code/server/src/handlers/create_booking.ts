import { db } from '../db';
import { bookingsTable, usersTable, classSchedulesTable, classesTable } from '../db/schema';
import { type CreateBookingInput, type Booking } from '../schema';
import { eq, and, count } from 'drizzle-orm';

export const createBooking = async (input: CreateBookingInput): Promise<Booking> => {
  try {
    // Verify user exists and is active
    const users = await db.select()
      .from(usersTable)
      .where(and(eq(usersTable.id, input.user_id), eq(usersTable.is_active, true)))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found or inactive');
    }

    // Verify class schedule exists and is not cancelled
    const scheduleResults = await db.select()
      .from(classSchedulesTable)
      .innerJoin(classesTable, eq(classSchedulesTable.class_id, classesTable.id))
      .where(
        and(
          eq(classSchedulesTable.id, input.class_schedule_id),
          eq(classSchedulesTable.is_cancelled, false),
          eq(classesTable.is_active, true)
        )
      )
      .execute();

    if (scheduleResults.length === 0) {
      throw new Error('Class schedule not found, cancelled, or class is inactive');
    }

    const scheduleData = scheduleResults[0];
    const maxCapacity = scheduleData.classes.max_capacity;

    // Check for existing booking for this user and class schedule
    const existingBookings = await db.select()
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.user_id, input.user_id),
          eq(bookingsTable.class_schedule_id, input.class_schedule_id),
          eq(bookingsTable.status, 'confirmed')
        )
      )
      .execute();

    if (existingBookings.length > 0) {
      throw new Error('User already has a confirmed booking for this class schedule');
    }

    // Check available capacity
    const capacityResults = await db.select({ 
      count: count() 
    })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.class_schedule_id, input.class_schedule_id),
          eq(bookingsTable.status, 'confirmed')
        )
      )
      .execute();

    const currentBookings = capacityResults[0].count;
    if (currentBookings >= maxCapacity) {
      throw new Error('Class is at full capacity');
    }

    // Create booking
    const result = await db.insert(bookingsTable)
      .values({
        user_id: input.user_id,
        class_schedule_id: input.class_schedule_id,
        status: 'confirmed'
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Booking creation failed:', error);
    throw error;
  }
};
