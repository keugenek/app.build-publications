import { db } from '../db';
import { serviceRemindersTable, carsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateServiceReminderInput, type ServiceReminder } from '../schema';

export const createServiceReminder = async (input: CreateServiceReminderInput): Promise<ServiceReminder> => {
  try {
    // Verify the car exists first to ensure foreign key constraint is satisfied
    const carExists = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.car_id))
      .execute();

    if (carExists.length === 0) {
      throw new Error(`Car with ID ${input.car_id} does not exist`);
    }

    // Insert service reminder record
    const result = await db.insert(serviceRemindersTable)
      .values({
        car_id: input.car_id,
        service_type: input.service_type,
        reminder_type: input.reminder_type,
        due_date: input.due_date,
        due_mileage: input.due_mileage,
        is_completed: false, // Default value from schema
        notes: input.notes
      })
      .returning()
      .execute();

    const serviceReminder = result[0];
    return serviceReminder;
  } catch (error) {
    console.error('Service reminder creation failed:', error);
    throw error;
  }
};
