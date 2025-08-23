import { eq } from 'drizzle-orm';
import { db } from '../db';
import { maintenanceEntriesTable } from '../db/schema';
import { type MaintenanceEntry } from '../schema';

export const getMaintenanceEntry = async (id: number): Promise<MaintenanceEntry | null> => {
  try {
    const result = await db.select()
      .from(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const entry = result[0];
    return {
      ...entry,
      cost: parseFloat(entry.cost), // Convert numeric string to number
      date: new Date(entry.date), // Ensure date is a Date object
      created_at: new Date(entry.created_at), // Ensure date is a Date object
      updated_at: new Date(entry.updated_at) // Ensure date is a Date object
    };
  } catch (error) {
    console.error('Failed to fetch maintenance entry:', error);
    throw error;
  }
};
