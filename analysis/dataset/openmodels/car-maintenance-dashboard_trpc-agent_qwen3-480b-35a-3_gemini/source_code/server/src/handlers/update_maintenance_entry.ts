import { db } from '../db';
import { maintenanceEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateMaintenanceEntryInput, type MaintenanceEntry } from '../schema';

export const updateMaintenanceEntry = async (input: UpdateMaintenanceEntryInput): Promise<MaintenanceEntry> => {
  try {
    // Prepare update data with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.car_id !== undefined) updateData.car_id = input.car_id;
    if (input.date !== undefined) updateData.date = input.date;
    if (input.service_type !== undefined) updateData.service_type = input.service_type;
    if (input.cost !== undefined) updateData.cost = input.cost.toString(); // Convert number to string for numeric column
    if (input.mileage_at_service !== undefined) updateData.mileage_at_service = input.mileage_at_service;
    if (input.notes !== undefined) updateData.notes = input.notes;

    // Update maintenance entry record
    const result = await db.update(maintenanceEntriesTable)
      .set(updateData)
      .where(eq(maintenanceEntriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Maintenance entry with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const entry = result[0];
    return {
      ...entry,
      cost: parseFloat(entry.cost), // Convert string back to number
      date: new Date(entry.date), // Ensure date is a Date object
      created_at: new Date(entry.created_at), // Ensure date is a Date object
      updated_at: new Date(entry.updated_at) // Ensure date is a Date object
    };
  } catch (error) {
    console.error('Maintenance entry update failed:', error);
    throw error;
  }
};
