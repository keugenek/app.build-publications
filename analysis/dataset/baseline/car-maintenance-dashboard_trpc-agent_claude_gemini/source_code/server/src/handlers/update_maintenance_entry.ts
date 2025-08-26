import { db } from '../db';
import { maintenanceEntriesTable } from '../db/schema';
import { type UpdateMaintenanceEntryInput, type MaintenanceEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMaintenanceEntry = async (input: UpdateMaintenanceEntryInput): Promise<MaintenanceEntry> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.service_date !== undefined) {
      updateData.service_date = input.service_date;
    }
    if (input.mileage !== undefined) {
      updateData.mileage = input.mileage;
    }
    if (input.service_type !== undefined) {
      updateData.service_type = input.service_type;
    }
    if (input.cost !== undefined) {
      updateData.cost = input.cost.toString(); // Convert number to string for numeric column
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update maintenance entry record
    const result = await db.update(maintenanceEntriesTable)
      .set(updateData)
      .where(eq(maintenanceEntriesTable.id, input.id))
      .returning()
      .execute();

    // Check if maintenance entry was found and updated
    if (result.length === 0) {
      throw new Error(`Maintenance entry with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const maintenanceEntry = result[0];
    return {
      ...maintenanceEntry,
      cost: parseFloat(maintenanceEntry.cost) // Convert string back to number
    };
  } catch (error) {
    console.error('Maintenance entry update failed:', error);
    throw error;
  }
};
