import { db } from '../db';
import { maintenanceEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteMaintenanceEntryInput } from '../schema';

export async function deleteMaintenanceEntry(input: DeleteMaintenanceEntryInput): Promise<{ success: boolean }> {
  try {
    // Delete the maintenance entry
    const result = await db.delete(maintenanceEntriesTable)
      .where(eq(maintenanceEntriesTable.id, input.id))
      .returning()
      .execute();

    // Return success status based on whether a record was deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Maintenance entry deletion failed:', error);
    throw error;
  }
}
