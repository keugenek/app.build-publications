import { db } from '../db';
import { bookmarksTable } from '../db/schema';
import { type SearchBookmarksInput, type Bookmark } from '../schema';
import { ilike, and, or, eq } from 'drizzle-orm';

export const searchBookmarks = async (input: SearchBookmarksInput): Promise<Bookmark[]> => {
  try {
    const results = await db.select()
      .from(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.user_id, input.user_id),
          or(
            ilike(bookmarksTable.title, `%${input.query}%`),
            ilike(bookmarksTable.url, `%${input.query}%`),
            ilike(bookmarksTable.description, `%${input.query}%`)
          )
        )
      )
      .execute();

    return results.map(bookmark => ({
      id: bookmark.id,
      user_id: bookmark.user_id,
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description ?? null,
      created_at: new Date(bookmark.created_at),
      updated_at: new Date(bookmark.updated_at)
    }));
  } catch (error) {
    console.error('Search bookmarks failed:', error);
    throw error;
  }
};
