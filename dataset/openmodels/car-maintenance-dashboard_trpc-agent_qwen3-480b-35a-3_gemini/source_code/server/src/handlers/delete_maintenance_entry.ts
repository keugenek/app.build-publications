import { db } from '../db';
import { maintenanceEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteMaintenanceEntry = async (id: number): Promise<boolean> => {
  try {
    // Delete maintenance entry by ID
    const result = await db.delete(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, id))
      .returning()
      .execute();

    // Return true if a record was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Maintenance entry deletion failed:', error);
    throw error;
  }
};
