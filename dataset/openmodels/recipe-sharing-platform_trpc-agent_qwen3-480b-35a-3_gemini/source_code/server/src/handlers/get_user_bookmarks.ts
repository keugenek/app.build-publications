import { db } from '../db';
import { bookmarksTable } from '../db/schema';
import { type Bookmark } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserBookmarks = async (userId: string): Promise<Bookmark[]> => {
  try {
    // Query bookmarks for the specific user
    const results = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.userId, userId))
      .execute();

    // Convert database results to schema-compliant bookmarks
    return results.map(bookmark => ({
      id: bookmark.id,
      recipeId: bookmark.recipeId,
      userId: bookmark.userId,
      createdAt: bookmark.createdAt
    }));
  } catch (error) {
    console.error('Failed to fetch user bookmarks:', error);
    throw error;
  }
};
