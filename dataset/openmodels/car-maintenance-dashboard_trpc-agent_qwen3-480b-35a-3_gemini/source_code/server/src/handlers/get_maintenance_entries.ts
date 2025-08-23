import { db } from '../db';
import { maintenanceEntriesTable } from '../db/schema';
import { type MaintenanceEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const getMaintenanceEntries = async (carId?: number): Promise<MaintenanceEntry[]> => {
  try {
    if (carId !== undefined) {
      const results = await db.select()
        .from(maintenanceEntriesTable)
        .where(eq(maintenanceEntriesTable.car_id, carId))
        .orderBy(maintenanceEntriesTable.date)
        .execute();

      // Convert numeric fields back to numbers before returning
      return results.map(entry => ({
        ...entry,
        cost: parseFloat(entry.cost) // Convert string back to number for numeric column
      }));
    } else {
      const results = await db.select()
        .from(maintenanceEntriesTable)
        .orderBy(maintenanceEntriesTable.date)
        .execute();

      // Convert numeric fields back to numbers before returning
      return results.map(entry => ({
        ...entry,
        cost: parseFloat(entry.cost) // Convert string back to number for numeric column
      }));
    }
  } catch (error) {
    console.error('Failed to fetch maintenance entries:', error);
    throw error;
  }
};
