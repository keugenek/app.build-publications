import { db } from '../db';
import { bookmarksTable } from '../db/schema';
import { type Bookmark } from '../schema';

export const getBookmarks = async (): Promise<Bookmark[]> => {
  try {
    const results = await db.select()
      .from(bookmarksTable)
      .execute();

    return results.map(bookmark => ({
      id: bookmark.id,
      user_id: bookmark.user_id,
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      created_at: bookmark.created_at,
      updated_at: bookmark.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error);
    throw error;
  }
};
