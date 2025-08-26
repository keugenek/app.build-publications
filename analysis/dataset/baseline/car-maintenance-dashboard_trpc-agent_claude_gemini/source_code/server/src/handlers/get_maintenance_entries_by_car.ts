import { db } from '../db';
import { maintenanceEntriesTable } from '../db/schema';
import { type GetMaintenanceEntriesByCarInput, type MaintenanceEntry } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getMaintenanceEntriesByCarId = async (input: GetMaintenanceEntriesByCarInput): Promise<MaintenanceEntry[]> => {
  try {
    // Query maintenance entries for the specified car, ordered by service date (most recent first)
    const results = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.car_id, input.car_id))
      .orderBy(desc(maintenanceEntriesTable.service_date))
      .execute();

    // Convert numeric cost field to number before returning
    return results.map(entry => ({
      ...entry,
      cost: parseFloat(entry.cost) // Convert string to number for numeric column
    }));
  } catch (error) {
    console.error('Failed to get maintenance entries by car:', error);
    throw error;
  }
};
