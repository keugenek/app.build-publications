import { db } from '../db';
import { collectionsTable, bookmarksTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteCollection = async (input: DeleteEntityInput): Promise<{ success: boolean }> => {
  try {
    // First, update all bookmarks that reference this collection to set collection_id to null
    await db.update(bookmarksTable)
      .set({ collection_id: null })
      .where(eq(bookmarksTable.collection_id, input.id))
      .execute();

    // Then delete the collection
    const result = await db.delete(collectionsTable)
      .where(eq(collectionsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Collection deletion failed:', error);
    throw error;
  }
};
