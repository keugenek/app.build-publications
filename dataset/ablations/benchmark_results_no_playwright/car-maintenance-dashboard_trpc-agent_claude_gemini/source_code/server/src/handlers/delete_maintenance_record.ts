import { db } from '../db';
import { maintenanceRecordsTable } from '../db/schema';
import { type DeleteRecordInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteMaintenanceRecord = async (input: DeleteRecordInput): Promise<{ success: boolean }> => {
  try {
    // Delete the maintenance record
    const result = await db.delete(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Maintenance record deletion failed:', error);
    throw error;
  }
};
