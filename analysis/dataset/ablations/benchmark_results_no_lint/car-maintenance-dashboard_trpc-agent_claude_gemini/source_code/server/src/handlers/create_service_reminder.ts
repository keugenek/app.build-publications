import { db } from '../db';
import { serviceRemindersTable, carsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateServiceReminderInput, type ServiceReminder } from '../schema';

export async function createServiceReminder(input: CreateServiceReminderInput): Promise<ServiceReminder> {
  try {
    // First, verify that the car exists to prevent foreign key constraint violations
    const existingCars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.car_id))
      .execute();

    if (existingCars.length === 0) {
      throw new Error(`Car with id ${input.car_id} not found`);
    }

    // Insert service reminder record
    const result = await db.insert(serviceRemindersTable)
      .values({
        car_id: input.car_id,
        due_date: input.due_date,
        service_description: input.service_description,
        is_completed: input.is_completed ?? false // Use nullish coalescing to handle undefined
      })
      .returning()
      .execute();

    const serviceReminder = result[0];
    return serviceReminder;
  } catch (error) {
    console.error('Service reminder creation failed:', error);
    throw error;
  }
}
