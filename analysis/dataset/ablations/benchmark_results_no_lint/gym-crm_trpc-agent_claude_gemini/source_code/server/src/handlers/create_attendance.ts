import { db } from '../db';
import { attendanceTable, bookingsTable } from '../db/schema';
import { type CreateAttendanceInput, type Attendance } from '../schema';
import { eq } from 'drizzle-orm';

export const createAttendance = async (input: CreateAttendanceInput): Promise<Attendance> => {
  try {
    // First, validate that the booking exists
    const existingBooking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, input.booking_id))
      .execute();

    if (existingBooking.length === 0) {
      throw new Error(`Booking with id ${input.booking_id} does not exist`);
    }

    // Insert attendance record
    const result = await db.insert(attendanceTable)
      .values({
        booking_id: input.booking_id,
        attended: input.attended,
        checked_in_at: input.attended ? new Date() : null,
        notes: input.notes || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Attendance creation failed:', error);
    throw error;
  }
};
