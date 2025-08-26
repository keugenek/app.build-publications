import { db } from '../db';
import { attendanceTable, bookingsTable, usersTable, classesTable } from '../db/schema';
import { type GetBookingsByClassInput, type Attendance } from '../schema';
import { eq } from 'drizzle-orm';

export const getAttendanceByClass = async (input: GetBookingsByClassInput): Promise<Attendance[]> => {
  try {
    // First verify the class exists
    const classExists = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .execute();

    if (classExists.length === 0) {
      throw new Error(`Class with ID ${input.class_id} not found`);
    }

    // Query attendance records with booking and user details
    const results = await db.select()
      .from(attendanceTable)
      .innerJoin(bookingsTable, eq(attendanceTable.booking_id, bookingsTable.id))
      .innerJoin(usersTable, eq(bookingsTable.user_id, usersTable.id))
      .where(eq(bookingsTable.class_id, input.class_id))
      .execute();

    // Map the joined results back to the Attendance schema format
    return results.map(result => ({
      id: result.attendance.id,
      booking_id: result.attendance.booking_id,
      attended: result.attendance.attended,
      checked_in_at: result.attendance.checked_in_at,
      notes: result.attendance.notes
    }));
  } catch (error) {
    console.error('Get attendance by class failed:', error);
    throw error;
  }
};
