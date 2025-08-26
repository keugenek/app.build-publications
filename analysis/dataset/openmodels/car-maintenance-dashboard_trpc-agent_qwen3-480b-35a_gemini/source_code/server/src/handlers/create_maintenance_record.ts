import { db } from '../db';
import { maintenanceRecordsTable } from '../db/schema';
import { type CreateMaintenanceRecordInput, type MaintenanceRecord } from '../schema';

export const createMaintenanceRecord = async (input: CreateMaintenanceRecordInput): Promise<MaintenanceRecord> => {
  try {
    // Insert maintenance record
    const result = await db.insert(maintenanceRecordsTable)
      .values({
        car_id: input.car_id,
        service_type: input.service_type,
        date: input.date.toISOString().split('T')[0], // Convert Date to string format for database
        mileage: input.mileage,
        cost: input.cost.toString(), // Convert number to string for numeric column
        notes: input.notes !== undefined ? input.notes : null // Handle nullable notes properly
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const record = result[0];
    return {
      ...record,
      cost: parseFloat(record.cost), // Convert string back to number
      date: new Date(record.date) // Convert string back to Date object
    };
  } catch (error) {
    console.error('Maintenance record creation failed:', error);
    throw error;
  }
};
