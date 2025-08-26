import { db } from '../db';
import { bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function deleteBookmark(bookmarkId: number, userId: number): Promise<boolean> {
  try {
    // First verify that the bookmark exists and belongs to the user
    const existingBookmarks = await db.select()
      .from(bookmarksTable)
      .where(and(
        eq(bookmarksTable.id, bookmarkId),
        eq(bookmarksTable.user_id, userId)
      ))
      .execute();

    if (existingBookmarks.length === 0) {
      return false; // Bookmark doesn't exist or doesn't belong to user
    }

    // Delete associated tag relationships first (due to foreign key constraints)
    await db.delete(bookmarkTagsTable)
      .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
      .execute();

    // Delete the bookmark itself
    const deleteResult = await db.delete(bookmarksTable)
      .where(and(
        eq(bookmarksTable.id, bookmarkId),
        eq(bookmarksTable.user_id, userId)
      ))
      .execute();

    return (deleteResult.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Bookmark deletion failed:', error);
    throw error;
  }
}
