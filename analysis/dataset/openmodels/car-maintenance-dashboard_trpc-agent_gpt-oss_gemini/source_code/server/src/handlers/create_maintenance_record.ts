import { db } from '../db';
import { maintenanceRecordsTable } from '../db/schema';
import { type CreateMaintenanceInput, type MaintenanceRecord } from '../schema';

export const createMaintenanceRecord = async (
  input: CreateMaintenanceInput,
): Promise<MaintenanceRecord> => {
  try {
    const result = await db
      .insert(maintenanceRecordsTable)
      .values({
        service_date: input.service_date,
        service_type: input.service_type,
        mileage: input.mileage,
        cost: input.cost.toString(), // numeric column expects string
        notes: input.notes ?? null,
      })
      .returning()
      .execute();

    const record = result[0];
    return {
      ...record,
      cost: parseFloat(record.cost as unknown as string), // convert back to number
    } as MaintenanceRecord;
  } catch (error) {
    console.error('Failed to create maintenance record:', error);
    throw error;
  }
};
