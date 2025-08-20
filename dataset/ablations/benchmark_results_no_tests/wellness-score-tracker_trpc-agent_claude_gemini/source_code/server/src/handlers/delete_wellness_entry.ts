import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type DeleteWellnessEntryInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteWellnessEntry(input: DeleteWellnessEntryInput): Promise<{ success: boolean }> {
  try {
    // Delete wellness entry by ID
    const result = await db.delete(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, input.id))
      .execute();

    // Check if any rows were affected (i.e., entry was found and deleted)
    const success = result.rowCount !== null && result.rowCount > 0;

    return { success };
  } catch (error) {
    console.error('Wellness entry deletion failed:', error);
    throw error;
  }
}
