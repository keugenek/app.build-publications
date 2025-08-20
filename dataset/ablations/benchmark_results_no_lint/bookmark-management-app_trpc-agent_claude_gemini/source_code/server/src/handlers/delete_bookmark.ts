import { db } from '../db';
import { bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const deleteBookmark = async (bookmarkId: number, userId: number): Promise<void> => {
  try {
    // First, verify that the bookmark exists and belongs to the user
    const existingBookmarks = await db.select()
      .from(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.id, bookmarkId),
          eq(bookmarksTable.user_id, userId)
        )
      )
      .execute();

    if (existingBookmarks.length === 0) {
      throw new Error('Bookmark not found or access denied');
    }

    // Delete associated bookmark-tag relationships first (foreign key constraint)
    await db.delete(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();

    // Delete the bookmark
    await db.delete(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.id, bookmarkId),
          eq(bookmarksTable.user_id, userId)
        )
      )
      .execute();

  } catch (error) {
    console.error('Bookmark deletion failed:', error);
    throw error;
  }
};
