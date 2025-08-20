import { db } from '../db';
import { maintenanceRecordsTable } from '../db/schema';
import { type UpdateMaintenanceRecordInput, type MaintenanceRecord } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMaintenanceRecord = async (input: UpdateMaintenanceRecordInput): Promise<MaintenanceRecord> => {
  try {
    // Build the update object, only including provided fields
    const updateData: any = {};
    
    if (input.car_id !== undefined) updateData.car_id = input.car_id;
    if (input.service_date !== undefined) updateData.service_date = input.service_date;
    if (input.service_type !== undefined) updateData.service_type = input.service_type;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.cost !== undefined) updateData.cost = input.cost.toString(); // Convert number to string for numeric column
    if (input.mileage !== undefined) updateData.mileage = input.mileage;
    if (input.notes !== undefined) updateData.notes = input.notes;

    // Update the maintenance record
    const result = await db.update(maintenanceRecordsTable)
      .set(updateData)
      .where(eq(maintenanceRecordsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Maintenance record with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const maintenanceRecord = result[0];
    return {
      ...maintenanceRecord,
      cost: parseFloat(maintenanceRecord.cost) // Convert string back to number
    };
  } catch (error) {
    console.error('Maintenance record update failed:', error);
    throw error;
  }
};
