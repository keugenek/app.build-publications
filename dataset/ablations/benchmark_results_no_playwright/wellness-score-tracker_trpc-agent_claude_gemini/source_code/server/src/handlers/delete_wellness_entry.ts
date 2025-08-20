import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntryInput } from '../schema';
import { eq, and } from 'drizzle-orm';

/**
 * Deletes a wellness entry for a specific user.
 * Ensures users can only delete their own wellness data.
 */
export const deleteWellnessEntry = async (input: GetWellnessEntryInput): Promise<boolean> => {
  try {
    // Delete the wellness entry, ensuring it belongs to the specified user
    const result = await db
      .delete(wellnessEntriesTable)
      .where(
        and(
          eq(wellnessEntriesTable.id, input.id),
          eq(wellnessEntriesTable.user_id, input.user_id)
        )
      )
      .returning({ id: wellnessEntriesTable.id })
      .execute();

    // Return true if a row was deleted, false if no matching entry was found
    return result.length > 0;
  } catch (error) {
    console.error('Wellness entry deletion failed:', error);
    throw error;
  }
};
