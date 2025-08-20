import { db } from '../db';
import { maintenanceRecordsTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { type GetMaintenanceRecordsByCarInput, type MaintenanceRecord } from '../schema';

export const getMaintenanceRecordsByCarId = async (input: GetMaintenanceRecordsByCarInput): Promise<MaintenanceRecord[]> => {
  try {
    // Query maintenance records for the specific car, ordered by service_date descending (newest first)
    const results = await db.select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.car_id, input.car_id))
      .orderBy(desc(maintenanceRecordsTable.service_date))
      .execute();

    // Convert numeric fields back to numbers for the response
    return results.map(record => ({
      ...record,
      cost: parseFloat(record.cost) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch maintenance records:', error);
    throw error;
  }
};
