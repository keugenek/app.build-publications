import { db } from '../db';
import { bookingsTable, classesTable, membersTable } from '../db/schema';
import { type Attendance } from '../schema';
import { eq } from 'drizzle-orm';

export async function getClassAttendance(classId: number): Promise<Attendance[]> {
  try {
    // Query bookings with member and class details using joins
    const results = await db.select({
      booking_id: bookingsTable.id,
      member_id: bookingsTable.member_id,
      member_name: membersTable.first_name, // We'll construct full name in mapping
      member_last_name: membersTable.last_name,
      class_id: bookingsTable.class_id,
      class_name: classesTable.name,
      class_date: classesTable.class_date,
      start_time: classesTable.start_time,
      status: bookingsTable.status
    })
    .from(bookingsTable)
    .innerJoin(membersTable, eq(bookingsTable.member_id, membersTable.id))
    .innerJoin(classesTable, eq(bookingsTable.class_id, classesTable.id))
    .where(eq(bookingsTable.class_id, classId))
    .execute();

    // Map the results to the Attendance schema format
    return results.map(result => ({
      booking_id: result.booking_id,
      member_id: result.member_id,
      member_name: `${result.member_name} ${result.member_last_name}`, // Combine first and last name
      class_id: result.class_id,
      class_name: result.class_name,
      class_date: new Date(result.class_date), // Convert string to Date
      start_time: result.start_time,
      status: result.status
    }));
  } catch (error) {
    console.error('Failed to get class attendance:', error);
    throw error;
  }
}
