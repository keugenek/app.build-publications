import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteWellnessEntry = async (id: number): Promise<boolean> => {
  try {
    // Delete the wellness entry with the specified ID
    const result = await db
      .delete(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, id))
      .returning()
      .execute();

    // Return true if a record was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Wellness entry deletion failed:', error);
    throw error;
  }
};
