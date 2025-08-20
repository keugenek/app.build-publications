import { db } from '../db';
import { maintenanceHistoryTable, carsTable } from '../db/schema';
import { type CreateMaintenanceHistoryInput, type MaintenanceHistory } from '../schema';
import { eq } from 'drizzle-orm';

export const createMaintenanceHistory = async (input: CreateMaintenanceHistoryInput): Promise<MaintenanceHistory> => {
  try {
    // First verify that the car exists
    const existingCar = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.car_id))
      .execute();

    if (existingCar.length === 0) {
      throw new Error(`Car with ID ${input.car_id} not found`);
    }

    // Insert maintenance history record
    const result = await db.insert(maintenanceHistoryTable)
      .values({
        car_id: input.car_id,
        service_date: input.service_date,
        service_type: input.service_type,
        mileage: input.mileage,
        cost: input.cost.toString(), // Convert number to string for numeric column
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
    console.error('Maintenance history creation failed:', error);
    throw error;
  }
};
