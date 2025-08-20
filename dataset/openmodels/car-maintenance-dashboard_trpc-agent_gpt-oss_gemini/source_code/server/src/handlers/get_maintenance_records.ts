import { db } from '../db';
import { maintenanceRecordsTable } from '../db/schema';
import { desc } from 'drizzle-orm';
import { type MaintenanceRecord } from '../schema';

// Fetch all maintenance records sorted by newest first.
export const getMaintenanceRecords = async (): Promise<MaintenanceRecord[]> => {
  const results = await db
    .select()
    .from(maintenanceRecordsTable)
    .orderBy(desc(maintenanceRecordsTable.created_at))
    .execute();

  // Convert numeric fields (cost) from string to number
  return results.map((record) => ({
    ...record,
    cost: parseFloat(record.cost as unknown as string),
  }));
};
