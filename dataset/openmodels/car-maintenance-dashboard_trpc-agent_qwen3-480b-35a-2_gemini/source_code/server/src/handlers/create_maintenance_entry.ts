import { db } from '../db';
import { maintenanceEntriesTable } from '../db/schema';
import { type CreateMaintenanceEntryInput, type MaintenanceEntry } from '../schema';

export const createMaintenanceEntry = async (input: CreateMaintenanceEntryInput): Promise<MaintenanceEntry> => {
  try {
    // Insert maintenance entry record
    const result = await db.insert(maintenanceEntriesTable)
      .values({
        carId: input.carId,
        dateOfService: input.dateOfService.toISOString().split('T')[0], // Convert Date to string format for date column
        serviceType: input.serviceType,
        cost: input.cost.toString(), // Convert number to string for numeric column
        mileage: input.mileage,
        notes: input.notes ?? null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const entry = result[0];
    return {
      ...entry,
      dateOfService: new Date(entry.dateOfService), // Convert string back to Date
      cost: parseFloat(entry.cost) // Convert string back to number
    };
  } catch (error) {
    console.error('Maintenance entry creation failed:', error);
    throw error;
  }
};
