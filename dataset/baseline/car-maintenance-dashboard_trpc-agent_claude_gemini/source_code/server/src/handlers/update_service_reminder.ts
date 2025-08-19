import { db } from '../db';
import { serviceRemindersTable } from '../db/schema';
import { type UpdateServiceReminderInput, type ServiceReminder } from '../schema';
import { eq } from 'drizzle-orm';

export const updateServiceReminder = async (input: UpdateServiceReminderInput): Promise<ServiceReminder> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.service_type !== undefined) {
      updateData.service_type = input.service_type;
    }
    
    if (input.reminder_type !== undefined) {
      updateData.reminder_type = input.reminder_type;
    }
    
    if (input.due_date !== undefined) {
      updateData.due_date = input.due_date;
    }
    
    if (input.due_mileage !== undefined) {
      updateData.due_mileage = input.due_mileage;
    }
    
    if (input.is_completed !== undefined) {
      updateData.is_completed = input.is_completed;
    }
    
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update the service reminder record
    const result = await db.update(serviceRemindersTable)
      .set(updateData)
      .where(eq(serviceRemindersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Service reminder with id ${input.id} not found`);
    }

    // Return the updated service reminder
    const reminder = result[0];
    return reminder as ServiceReminder;
  } catch (error) {
    console.error('Service reminder update failed:', error);
    throw error;
  }
};
