import { db } from '../db';
import { serviceRemindersTable } from '../db/schema';
import { type GetServiceRemindersByCarInput, type ServiceReminder } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getServiceRemindersByCar = async (input: GetServiceRemindersByCarInput): Promise<ServiceReminder[]> => {
  try {
    // Query service reminders for the specific car, ordered by due date (earliest first)
    const results = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.car_id, input.car_id))
      .orderBy(asc(serviceRemindersTable.due_date))
      .execute();

    // Return the results as they match the ServiceReminder schema
    return results;
  } catch (error) {
    console.error('Failed to get service reminders by car:', error);
    throw error;
  }
};
