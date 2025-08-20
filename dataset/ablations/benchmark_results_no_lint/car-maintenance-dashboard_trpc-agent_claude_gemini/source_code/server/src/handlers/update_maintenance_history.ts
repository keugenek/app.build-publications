import { db } from '../db';
import { maintenanceHistoryTable } from '../db/schema';
import { type UpdateMaintenanceHistoryInput, type MaintenanceHistory } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMaintenanceHistory = async (input: UpdateMaintenanceHistoryInput): Promise<MaintenanceHistory> => {
  try {
    // First, verify that the maintenance history record exists
    const existing = await db.select()
      .from(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Maintenance history record with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.service_date !== undefined) {
      updateData.service_date = input.service_date;
    }
    
    if (input.service_type !== undefined) {
      updateData.service_type = input.service_type;
    }
    
    if (input.mileage !== undefined) {
      updateData.mileage = input.mileage;
    }
    
    if (input.cost !== undefined) {
      updateData.cost = input.cost.toString(); // Convert number to string for numeric column
    }
    
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update the maintenance history record
    const result = await db.update(maintenanceHistoryTable)
      .set(updateData)
      .where(eq(maintenanceHistoryTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const maintenanceHistory = result[0];
    return {
      ...maintenanceHistory,
      cost: parseFloat(maintenanceHistory.cost) // Convert string back to number
    };
  } catch (error) {
    console.error('Maintenance history update failed:', error);
    throw error;
  }
};
