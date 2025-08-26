import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteWellnessEntry = async (id: number): Promise<boolean> => {
  try {
    // Execute delete query
    const result = await db.delete(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, id))
      .execute();

    // Return true if a row was deleted, false if no row was found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Wellness entry deletion failed:', error);
    throw error;
  }
};
