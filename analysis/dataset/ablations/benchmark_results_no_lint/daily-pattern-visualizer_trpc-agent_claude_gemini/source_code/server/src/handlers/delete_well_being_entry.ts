import { db } from '../db';
import { wellBeingEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteWellBeingEntry(id: number): Promise<boolean> {
  try {
    // Delete the entry by ID and get the result
    const result = await db.delete(wellBeingEntriesTable)
      .where(eq(wellBeingEntriesTable.id, id))
      .returning()
      .execute();

    // Return true if a record was deleted, false if no record found
    return result.length > 0;
  } catch (error) {
    console.error('Well-being entry deletion failed:', error);
    throw error;
  }
}
