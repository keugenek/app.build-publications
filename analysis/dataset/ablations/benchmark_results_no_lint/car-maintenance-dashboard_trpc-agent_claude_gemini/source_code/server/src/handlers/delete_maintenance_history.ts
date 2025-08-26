import { db } from '../db';
import { maintenanceHistoryTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteByIdInput } from '../schema';

export async function deleteMaintenanceHistory(input: DeleteByIdInput): Promise<boolean> {
  try {
    const result = await db.delete(maintenanceHistoryTable)
      .where(eq(maintenanceHistoryTable.id, input.id))
      .execute();

    // Return true if a record was deleted (rowCount > 0), false if no record was found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Maintenance history deletion failed:', error);
    throw error;
  }
}
