import { db } from '../db';
import { bookmarksTable } from '../db/schema';
import { type Bookmark } from '../schema';
import { eq } from 'drizzle-orm';

export const getBookmarks = async (userId: number): Promise<Bookmark[]> => {
  try {
    // Query bookmarks for the specified user
    const results = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.user_id, userId))
      .execute();

    // Map results to match the Zod schema
    // Note: The database doesn't have collection_id, so we set it to null
    // The Zod schema expects collection_id but the database uses a junction table
    return results.map(bookmark => ({
      id: bookmark.id,
      user_id: bookmark.user_id,
      collection_id: null, // Database uses junction table, not direct field
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description,
      created_at: bookmark.created_at,
      updated_at: bookmark.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error);
    throw error;
  }
};
