import { db } from '../db';
import { bookmarksTable } from '../db/schema';
import { type Bookmark } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserBookmarks = async (userId: number): Promise<Bookmark[]> => {
  try {
    // Query bookmarks for the specified user
    const results = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.user_id, userId))
      .execute();

    // Convert date fields and return bookmarks
    return results.map(bookmark => ({
      ...bookmark,
      created_at: new Date(bookmark.created_at),
      updated_at: new Date(bookmark.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch user bookmarks:', error);
    throw error;
  }
};
