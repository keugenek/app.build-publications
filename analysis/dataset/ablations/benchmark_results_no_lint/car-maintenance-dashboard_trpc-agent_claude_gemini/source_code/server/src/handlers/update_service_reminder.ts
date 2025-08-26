import { db } from '../db';
import { serviceRemindersTable } from '../db/schema';
import { type UpdateServiceReminderInput, type ServiceReminder } from '../schema';
import { eq } from 'drizzle-orm';

export const updateServiceReminder = async (input: UpdateServiceReminderInput): Promise<ServiceReminder> => {
  try {
    // First, verify that the service reminder exists
    const existingReminder = await db.select()
      .from(serviceRemindersTable)
      .where(eq(serviceRemindersTable.id, input.id))
      .execute();

    if (existingReminder.length === 0) {
      throw new Error(`Service reminder with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof serviceRemindersTable.$inferInsert> = {};
    if (input.due_date !== undefined) {
      updateData.due_date = input.due_date;
    }
    if (input.service_description !== undefined) {
      updateData.service_description = input.service_description;
    }
    if (input.is_completed !== undefined) {
      updateData.is_completed = input.is_completed;
    }

    // Perform the update
    const result = await db.update(serviceRemindersTable)
      .set(updateData)
      .where(eq(serviceRemindersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Service reminder update failed:', error);
    throw error;
  }
};
