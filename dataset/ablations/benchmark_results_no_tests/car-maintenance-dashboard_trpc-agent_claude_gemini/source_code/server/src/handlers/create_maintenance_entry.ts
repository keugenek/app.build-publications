import { db } from '../db';
import { maintenanceEntriesTable, carsTable } from '../db/schema';
import { type CreateMaintenanceEntryInput, type MaintenanceEntry } from '../schema';
import { eq } from 'drizzle-orm';

export async function createMaintenanceEntry(input: CreateMaintenanceEntryInput): Promise<MaintenanceEntry> {
  try {
    // First, verify the car exists
    const existingCar = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.car_id))
      .execute();

    if (existingCar.length === 0) {
      throw new Error(`Car with ID ${input.car_id} not found`);
    }

    const car = existingCar[0];

    // Insert maintenance entry record
    const result = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: input.car_id,
        service_date: input.service_date,
        service_type: input.service_type,
        description: input.description,
        cost: input.cost.toString(), // Convert number to string for numeric column
        mileage_at_service: input.mileage_at_service
      })
      .returning()
      .execute();

    const maintenanceEntry = result[0];

    // Update car's current mileage if the service mileage is higher
    if (input.mileage_at_service > car.current_mileage) {
      await db.update(carsTable)
        .set({
          current_mileage: input.mileage_at_service,
          updated_at: new Date()
        })
        .where(eq(carsTable.id, input.car_id))
        .execute();
    }

    // Convert numeric fields back to numbers before returning
    return {
      ...maintenanceEntry,
      cost: parseFloat(maintenanceEntry.cost) // Convert string back to number
    };
  } catch (error) {
    console.error('Maintenance entry creation failed:', error);
    throw error;
  }
}
