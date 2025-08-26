import { db } from '../db';
import { serviceRemindersTable } from '../db/schema';
import { type ServiceReminder } from '../schema';
import { eq, asc, and } from 'drizzle-orm';

export const getUpcomingServiceReminders = async (): Promise<ServiceReminder[]> => {
  try {
    // Fetch all non-completed service reminders, ordered by due date/mileage
    const results = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.is_completed, false))
      .orderBy(
        asc(serviceRemindersTable.due_date),
        asc(serviceRemindersTable.due_mileage)
      )
      .execute();

    // Convert numeric fields and return
    return results.map(reminder => ({
      ...reminder,
      // Note: due_mileage is integer, not numeric, so no conversion needed
    }));
  } catch (error) {
    console.error('Failed to fetch upcoming service reminders:', error);
    throw error;
  }
};
