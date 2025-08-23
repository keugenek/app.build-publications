import { db } from '../db';
import { maintenanceEntriesTable } from '../db/schema';
import { type MaintenanceEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const getMaintenanceEntry = async (id: number): Promise<MaintenanceEntry | null> => {
  try {
    const result = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const entry = result[0];
    return {
      ...entry,
      cost: parseFloat(entry.cost), // Convert string back to number
      dateOfService: new Date(entry.dateOfService),
      created_at: new Date(entry.created_at)
    };
  } catch (error) {
    console.error('Failed to fetch maintenance entry:', error);
    throw error;
  }
};
