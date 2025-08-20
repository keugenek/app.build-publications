import { db } from '../db';
import { bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const deleteBookmark = async (bookmarkId: number, userId: number): Promise<boolean> => {
  try {
    // First verify the bookmark exists and belongs to the user
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.id, bookmarkId),
          eq(bookmarksTable.user_id, userId)
        )
      )
      .execute();

    if (bookmarks.length === 0) {
      return false; // Bookmark doesn't exist or doesn't belong to user
    }

    // Delete bookmark-tag relationships first (foreign key constraint)
    await db.delete(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();

    // Delete the bookmark itself
    const result = await db.delete(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.id, bookmarkId),
          eq(bookmarksTable.user_id, userId)
        )
      )
      .execute();

    // Return true if a row was deleted
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Bookmark deletion failed:', error);
    throw error;
  }
};
