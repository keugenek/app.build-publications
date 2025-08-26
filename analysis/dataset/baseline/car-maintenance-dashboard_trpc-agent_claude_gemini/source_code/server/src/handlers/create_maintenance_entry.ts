import { db } from '../db';
import { maintenanceEntriesTable, carsTable } from '../db/schema';
import { type CreateMaintenanceEntryInput, type MaintenanceEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const createMaintenanceEntry = async (input: CreateMaintenanceEntryInput): Promise<MaintenanceEntry> => {
  try {
    // First verify that the car exists to prevent foreign key constraint violations
    const car = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.car_id))
      .execute();

    if (car.length === 0) {
      throw new Error(`Car with id ${input.car_id} not found`);
    }

    // Insert maintenance entry record
    const result = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: input.car_id,
        service_date: input.service_date,
        mileage: input.mileage,
        service_type: input.service_type,
        cost: input.cost.toString(), // Convert number to string for numeric column
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const maintenanceEntry = result[0];
    return {
      ...maintenanceEntry,
      cost: parseFloat(maintenanceEntry.cost) // Convert string back to number
    };
  } catch (error) {
    console.error('Maintenance entry creation failed:', error);
    throw error;
  }
};
