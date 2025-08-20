import { db } from '../db';
import { maintenanceRecordsTable, carsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateMaintenanceRecordInput, type MaintenanceRecord } from '../schema';

export const createMaintenanceRecord = async (input: CreateMaintenanceRecordInput): Promise<MaintenanceRecord> => {
  try {
    // First verify that the car exists to prevent foreign key constraint violations
    const existingCar = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.car_id))
      .execute();

    if (existingCar.length === 0) {
      throw new Error(`Car with id ${input.car_id} not found`);
    }

    // Insert maintenance record
    const result = await db.insert(maintenanceRecordsTable)
      .values({
        car_id: input.car_id,
        service_date: input.service_date,
        service_type: input.service_type,
        description: input.description,
        cost: input.cost.toString(), // Convert number to string for numeric column
        mileage: input.mileage,
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const maintenanceRecord = result[0];
    return {
      ...maintenanceRecord,
      cost: parseFloat(maintenanceRecord.cost) // Convert string back to number
    };
  } catch (error) {
    console.error('Maintenance record creation failed:', error);
    throw error;
  }
};
