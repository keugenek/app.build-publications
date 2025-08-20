import { db } from '../db';
import { maintenanceRecordsTable } from '../db/schema';
import { type MaintenanceRecord } from '../schema';

export const getMaintenanceRecords = async (): Promise<MaintenanceRecord[]> => {
  try {
    const records = await db.select()
      .from(maintenanceRecordsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return records.map(record => ({
      ...record,
      cost: parseFloat(record.cost) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch maintenance records:', error);
    throw error;
  }
};
