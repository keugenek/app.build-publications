import { db } from '../db';
import { bookingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function markAttendance(bookingId: number, attended: boolean): Promise<{ success: boolean }> {
  try {
    // Update the booking with attendance status and timestamp
    const result = await db.update(bookingsTable)
      .set({
        booking_status: attended ? 'attended' : 'no_show',
        attendance_marked_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning()
      .execute();

    // Check if any record was updated
    if (result.length === 0) {
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Mark attendance failed:', error);
    throw error;
  }
}
