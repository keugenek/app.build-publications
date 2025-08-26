import { db } from '../db';
import { collectionsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function deleteCollection(collectionId: number, userId: number): Promise<boolean> {
  try {
    // Delete collection only if it belongs to the authenticated user
    const result = await db.delete(collectionsTable)
      .where(
        and(
          eq(collectionsTable.id, collectionId),
          eq(collectionsTable.user_id, userId)
        )
      )
      .execute();

    // Return true if a row was deleted, false if no matching collection was found
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Collection deletion failed:', error);
    throw error;
  }
}
