import { db } from '../db';
import { classSchedulesTable, bookingsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const deleteClassSchedule = async (id: number): Promise<{ success: boolean }> => {
  try {
    // First, check if the class schedule exists and is in the future
    const classSchedule = await db.select()
      .from(classSchedulesTable)
      .where(eq(classSchedulesTable.id, id))
      .limit(1)
      .execute();

    if (classSchedule.length === 0) {
      throw new Error('Class schedule not found');
    }

    const schedule = classSchedule[0];
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format

    // Only allow deletion of future scheduled classes
    if (schedule.scheduled_date <= todayString) {
      throw new Error('Cannot delete past or current day class schedules');
    }

    // First, cancel all existing bookings for this class schedule
    await db.update(bookingsTable)
      .set({
        booking_status: 'cancelled',
        cancellation_date: new Date(),
        updated_at: new Date()
      })
      .where(and(
        eq(bookingsTable.class_schedule_id, id),
        eq(bookingsTable.booking_status, 'booked')
      ))
      .execute();

    // Then delete all bookings for this class schedule to avoid foreign key constraint
    // This is necessary because PostgreSQL foreign key constraints prevent deletion
    await db.delete(bookingsTable)
      .where(eq(bookingsTable.class_schedule_id, id))
      .execute();

    // Delete the class schedule
    await db.delete(classSchedulesTable)
      .where(eq(classSchedulesTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Class schedule deletion failed:', error);
    throw error;
  }
};
