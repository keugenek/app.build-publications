import { db } from '../db';
import { classesTable, classSchedulesTable, bookingsTable } from '../db/schema';
import { eq, and, gte } from 'drizzle-orm';

export const deleteClass = async (id: number): Promise<{ success: boolean }> => {
  try {
    // First, verify the class exists
    const existingClass = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, id))
      .execute();

    if (existingClass.length === 0) {
      throw new Error(`Class with id ${id} not found`);
    }

    // Soft delete the class by setting is_active to false
    await db.update(classesTable)
      .set({ 
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(classesTable.id, id))
      .execute();

    // Get current date to determine future vs past schedules
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'

    // Cancel all future scheduled instances of this class
    const futureSchedules = await db.select()
      .from(classSchedulesTable)
      .where(
        and(
          eq(classSchedulesTable.class_id, id),
          gte(classSchedulesTable.scheduled_date, todayString)
        )
      )
      .execute();

    // Update future schedules to cancelled status
    if (futureSchedules.length > 0) {
      await db.update(classSchedulesTable)
        .set({ 
          is_cancelled: true,
          cancellation_reason: 'Class deactivated',
          updated_at: new Date()
        })
        .where(
          and(
            eq(classSchedulesTable.class_id, id),
            gte(classSchedulesTable.scheduled_date, todayString)
          )
        )
        .execute();

      // Cancel all bookings for these future schedules
      const futureScheduleIds = futureSchedules.map(schedule => schedule.id);
      
      for (const scheduleId of futureScheduleIds) {
        await db.update(bookingsTable)
          .set({ 
            booking_status: 'cancelled',
            cancellation_date: new Date(),
            updated_at: new Date()
          })
          .where(
            and(
              eq(bookingsTable.class_schedule_id, scheduleId),
              eq(bookingsTable.booking_status, 'booked')
            )
          )
          .execute();
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Class deletion failed:', error);
    throw error;
  }
};
