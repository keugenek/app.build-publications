import { db } from '../db';
import { maintenanceEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteMaintenanceEntry = async (id: number): Promise<boolean> => {
  try {
    const result = await db
      .delete(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, id))
      .returning()
      .execute();
    
    // If result array is empty, no record was deleted
    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete maintenance entry:', error);
    throw error;
  }
};
