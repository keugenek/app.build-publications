import { type AssignTagToBookmarkInput, type Bookmark } from '../schema';

import { db } from '../db';
import { tables } from '../db/schema';
import { eq, and } from 'drizzle-orm';
/** Removes a tag from a bookmark and returns the updated bookmark. */
export const removeTagFromBookmark = async (input: AssignTagToBookmarkInput): Promise<Bookmark> => {
  try {
    // Delete the linking record
    await db
      .delete(tables.bookmarkTags)
      .where(
        and(
          eq(tables.bookmarkTags.bookmark_id, input.bookmark_id),
          eq(tables.bookmarkTags.tag_id, input.tag_id)
        )
      )
      .execute();

    // Fetch and return the bookmark
    const bookmarkRows = await db
      .select()
      .from(tables.bookmarks)
      .where(eq(tables.bookmarks.id, input.bookmark_id))
      .limit(1)
      .execute();

    if (bookmarkRows.length === 0) {
      throw new Error('Bookmark not found');
    }
    return bookmarkRows[0] as Bookmark;
  } catch (error) {
    console.error('Failed to remove tag from bookmark:', error);
    throw error;
  }
};
