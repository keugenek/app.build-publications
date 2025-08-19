import { db } from '../db';
import { maintenanceEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteMaintenanceEntry = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the maintenance entry record
    const result = await db
      .delete(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, id))
      .returning()
      .execute();

    // Return success status based on whether a record was deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Maintenance entry deletion failed:', error);
    throw error;
  }
};
