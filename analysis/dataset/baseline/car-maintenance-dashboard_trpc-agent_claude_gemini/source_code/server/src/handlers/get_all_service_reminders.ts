import { db } from '../db';
import { serviceRemindersTable } from '../db/schema';
import { type ServiceReminder } from '../schema';

export const getAllServiceReminders = async (): Promise<ServiceReminder[]> => {
  try {
    const results = await db.select()
      .from(serviceRemindersTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(reminder => ({
      ...reminder,
      due_mileage: reminder.due_mileage ? parseInt(reminder.due_mileage.toString()) : null
    }));
  } catch (error) {
    console.error('Get all service reminders failed:', error);
    throw error;
  }
};
