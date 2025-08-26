import { db } from '../db';
import { maintenanceHistoryTable } from '../db/schema';
import { type GetMaintenanceHistoryByCarInput, type MaintenanceHistory } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getMaintenanceHistoryByCar(input: GetMaintenanceHistoryByCarInput): Promise<MaintenanceHistory[]> {
  try {
    // Query maintenance history for the specific car, ordered by service date (most recent first)
    const results = await db.select()
      .from(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.car_id, input.car_id))
      .orderBy(desc(maintenanceHistoryTable.service_date))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(record => ({
      ...record,
      cost: parseFloat(record.cost) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to get maintenance history by car:', error);
    throw error;
  }
}
