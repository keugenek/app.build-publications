import { db } from '../db';
import { bookmarksTable, bookmarkCollectionsTable, bookmarkTagsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteBookmark = async (id: number): Promise<boolean> => {
  try {
    // First delete related records in junction tables to avoid foreign key constraint violations
    await db.delete(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, id))
      .execute();
    
    await db.delete(bookmarkCollectionsTable)
      .where(eq(bookmarkCollectionsTable.bookmark_id, id))
      .execute();
    
    // Then delete the bookmark itself
    const result = await db.delete(bookmarksTable)
      .where(eq(bookmarksTable.id, id))
      .returning()
      .execute();
    
    // Return true if a bookmark was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Bookmark deletion failed:', error);
    throw error;
  }
};
