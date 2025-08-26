import { db } from '../db';
import { serviceRemindersTable } from '../db/schema';
import { type GetServiceRemindersByCarInput, type ServiceReminder } from '../schema';
import { eq } from 'drizzle-orm';

export const getServiceRemindersByCarId = async (input: GetServiceRemindersByCarInput): Promise<ServiceReminder[]> => {
  try {
    // Query service reminders for the specified car
    const results = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.car_id, input.car_id))
      .execute();

    // Return results (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Failed to get service reminders by car:', error);
    throw error;
  }
};
