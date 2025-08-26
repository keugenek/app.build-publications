import { db } from '../db';
import { maintenanceEntriesTable, carsTable } from '../db/schema';
import { type UpdateMaintenanceEntryInput, type MaintenanceEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMaintenanceEntry = async (input: UpdateMaintenanceEntryInput): Promise<MaintenanceEntry> => {
  try {
    // Check if the maintenance entry exists
    const existingEntry = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, input.id))
      .execute();

    if (existingEntry.length === 0) {
      throw new Error(`Maintenance entry with id ${input.id} not found`);
    }

    // Check if car exists when carId is being updated
    if (input.carId !== undefined) {
      const carExists = await db.select()
        .from(carsTable)
        .where(eq(carsTable.id, input.carId))
        .execute();

      if (carExists.length === 0) {
        throw new Error(`Car with id ${input.carId} not found`);
      }
    }

    // Prepare update values - only include fields that are provided
    const updateValues: any = {};
    
    if (input.carId !== undefined) {
      updateValues.carId = input.carId;
    }
    
    if (input.dateOfService !== undefined) {
      updateValues.dateOfService = input.dateOfService.toISOString().split('T')[0]; // Convert Date to string format for date column
    }
    
    if (input.serviceType !== undefined) {
      updateValues.serviceType = input.serviceType;
    }
    
    if (input.cost !== undefined) {
      updateValues.cost = input.cost.toString(); // Convert number to string for numeric column
    }
    
    if (input.mileage !== undefined) {
      updateValues.mileage = input.mileage;
    }
    
    if (input.notes !== undefined) {
      updateValues.notes = input.notes;
    }

    // Update maintenance entry record
    const result = await db.update(maintenanceEntriesTable)
      .set(updateValues)
      .where(eq(maintenanceEntriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Failed to update maintenance entry with id ${input.id}`);
    }

    // Convert numeric fields back to numbers before returning
    const updatedEntry = result[0];
    return {
      ...updatedEntry,
      cost: parseFloat(updatedEntry.cost), // Convert string back to number
      dateOfService: updatedEntry.dateOfService ? new Date(updatedEntry.dateOfService) : new Date(),
      created_at: new Date(updatedEntry.created_at)
    };
  } catch (error) {
    console.error('Maintenance entry update failed:', error);
    throw error;
  }
};
