import { db } from '../db';
import { maintenanceRecordsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteMaintenanceRecord = async (id: number): Promise<boolean> => {
  try {
    // Delete maintenance record by ID
    const result = await db.delete(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, id))
      .returning()
      .execute();
    
    // Return true if a record was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Maintenance record deletion failed:', error);
    throw error;
  }
};
