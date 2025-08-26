import { db } from '../db';
import { maintenanceEntriesTable } from '../db/schema';
import { type MaintenanceEntry } from '../schema';

export const getAllMaintenanceEntries = async (): Promise<MaintenanceEntry[]> => {
  try {
    const results = await db.select()
      .from(maintenanceEntriesTable)
      .execute();

    // Convert numeric cost field back to number for schema compatibility
    return results.map(entry => ({
      ...entry,
      cost: parseFloat(entry.cost)
    }));
  } catch (error) {
    console.error('Failed to fetch maintenance entries:', error);
    throw error;
  }
};
