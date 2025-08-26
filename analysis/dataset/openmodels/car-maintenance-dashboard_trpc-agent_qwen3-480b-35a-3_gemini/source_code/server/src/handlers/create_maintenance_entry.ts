import { db } from '../db';
import { maintenanceEntriesTable } from '../db/schema';
import { type CreateMaintenanceEntryInput, type MaintenanceEntry } from '../schema';

export const createMaintenanceEntry = async (input: CreateMaintenanceEntryInput): Promise<MaintenanceEntry> => {
  try {
    // Insert maintenance entry record
    const result = await db.insert(maintenanceEntriesTable)
      .values({
        car_id: input.car_id,
        date: input.date,
        service_type: input.service_type,
        cost: input.cost.toString(), // Convert number to string for numeric column
        mileage_at_service: input.mileage_at_service,
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const maintenanceEntry = result[0];
    return {
      ...maintenanceEntry,
      cost: parseFloat(maintenanceEntry.cost), // Convert string back to number
      date: new Date(maintenanceEntry.date), // Ensure Date object
      created_at: new Date(maintenanceEntry.created_at), // Ensure Date object
      updated_at: new Date(maintenanceEntry.updated_at) // Ensure Date object
    };
  } catch (error) {
    console.error('Maintenance entry creation failed:', error);
    throw error;
  }
};
