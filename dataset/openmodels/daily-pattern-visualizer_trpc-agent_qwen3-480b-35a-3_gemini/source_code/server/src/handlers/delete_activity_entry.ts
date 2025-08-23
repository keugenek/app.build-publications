import { db } from '../db';
import { activityEntriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteActivityEntry = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(activityEntriesTable)
      .where(eq(activityEntriesTable.id, id))
      .returning({ id: activityEntriesTable.id })
      .execute();

    // If we successfully deleted a record, the result array will contain the deleted entry
    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete activity entry:', error);
    throw error;
  }
};
