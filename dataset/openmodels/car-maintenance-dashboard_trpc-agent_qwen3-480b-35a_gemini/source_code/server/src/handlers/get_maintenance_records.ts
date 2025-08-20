import { db } from '../db';
import { maintenanceRecordsTable } from '../db/schema';
import { type MaintenanceRecord } from '../schema';
import { eq } from 'drizzle-orm';

export const getMaintenanceRecords = async (carId: number): Promise<MaintenanceRecord[]> => {
  try {
    const results = await db.select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.car_id, carId))
      .orderBy(maintenanceRecordsTable.date)
      .execute();

    // Convert numeric fields back to numbers before returning
    // Also convert date strings to Date objects
    return results.map(record => ({
      ...record,
      cost: parseFloat(record.cost),
      date: new Date(record.date)
    }));
  } catch (error) {
    console.error('Failed to fetch maintenance records:', error);
    throw error;
  }
};
