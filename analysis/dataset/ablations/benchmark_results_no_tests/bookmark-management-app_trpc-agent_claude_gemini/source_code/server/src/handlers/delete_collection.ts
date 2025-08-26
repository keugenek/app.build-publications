import { db } from '../db';
import { collectionsTable, bookmarksTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function deleteCollection(collectionId: number, userId: number): Promise<boolean> {
  try {
    // First verify that the collection exists and belongs to the user
    const existingCollection = await db.select()
      .from(collectionsTable)
      .where(
        and(
          eq(collectionsTable.id, collectionId),
          eq(collectionsTable.user_id, userId)
        )
      )
      .execute();

    if (existingCollection.length === 0) {
      return false; // Collection doesn't exist or doesn't belong to user
    }

    // Update any bookmarks in this collection to have null collection_id
    // This preserves bookmarks when a collection is deleted
    await db.update(bookmarksTable)
      .set({ collection_id: null })
      .where(eq(bookmarksTable.collection_id, collectionId))
      .execute();

    // Delete the collection
    const result = await db.delete(collectionsTable)
      .where(
        and(
          eq(collectionsTable.id, collectionId),
          eq(collectionsTable.user_id, userId)
        )
      )
      .execute();

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Collection deletion failed:', error);
    throw error;
  }
}
