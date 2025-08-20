import { db } from '../db';
import { membersTable, bookingsTable, classSchedulesTable } from '../db/schema';
import { eq, and, gte } from 'drizzle-orm';

export async function deleteMember(id: number): Promise<{ success: boolean }> {
  try {
    // First, verify the member exists and is active
    const existingMember = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, id))
      .execute();

    if (existingMember.length === 0) {
      throw new Error(`Member with id ${id} not found`);
    }

    if (!existingMember[0].is_active) {
      throw new Error(`Member with id ${id} is already deactivated`);
    }

    // Get current date to identify future bookings
    const currentDate = new Date().toISOString().split('T')[0]; // Convert to YYYY-MM-DD string

    // Cancel all future bookings for this member
    // We need to join with class_schedules to get the scheduled_date
    const futureBookings = await db.select({
      booking_id: bookingsTable.id,
      schedule_id: bookingsTable.class_schedule_id,
    })
      .from(bookingsTable)
      .innerJoin(classSchedulesTable, eq(bookingsTable.class_schedule_id, classSchedulesTable.id))
      .where(
        and(
          eq(bookingsTable.member_id, id),
          eq(bookingsTable.booking_status, 'booked'),
          gte(classSchedulesTable.scheduled_date, currentDate)
        )
      )
      .execute();

    // Cancel future bookings and update current_bookings count
    for (const booking of futureBookings) {
      // Cancel the booking
      await db.update(bookingsTable)
        .set({
          booking_status: 'cancelled',
          cancellation_date: new Date(),
          updated_at: new Date()
        })
        .where(eq(bookingsTable.id, booking.booking_id))
        .execute();

      // Get current booking count and decrement it
      const currentSchedule = await db.select()
        .from(classSchedulesTable)
        .where(eq(classSchedulesTable.id, booking.schedule_id))
        .execute();

      await db.update(classSchedulesTable)
        .set({
          current_bookings: Math.max(0, currentSchedule[0].current_bookings - 1),
          updated_at: new Date()
        })
        .where(eq(classSchedulesTable.id, booking.schedule_id))
        .execute();
    }

    // Soft delete the member by setting is_active to false
    await db.update(membersTable)
      .set({
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(membersTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Member deletion failed:', error);
    throw error;
  }
}
