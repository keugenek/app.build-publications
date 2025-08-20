import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type DeleteWellnessEntryInput } from '../schema';
import { and, eq } from 'drizzle-orm';

export const deleteWellnessEntry = async (input: DeleteWellnessEntryInput): Promise<boolean> => {
  try {
    // Delete the wellness entry only if it belongs to the specified user
    const result = await db.delete(wellnessEntriesTable)
      .where(and(
        eq(wellnessEntriesTable.id, input.id),
        eq(wellnessEntriesTable.user_id, input.user_id)
      ))
      .execute();

    // Return true if a record was deleted (rowCount > 0), false otherwise
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Wellness entry deletion failed:', error);
    throw error;
  }
};
