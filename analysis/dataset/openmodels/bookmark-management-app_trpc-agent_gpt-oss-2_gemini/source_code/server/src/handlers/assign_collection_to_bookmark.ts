import { db } from '../db';
import { tables } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type AssignCollectionToBookmarkInput, type Bookmark } from '../schema';

/** Assign a collection to a bookmark by inserting into the linking table.
 * Returns the updated bookmark record.
 */
export const assignCollectionToBookmark = async (
  input: AssignCollectionToBookmarkInput
): Promise<Bookmark> => {
  try {
    // Ensure bookmark exists before linking
    const existingBookmarks = await db
      .select()
      .from(tables.bookmarks)
      .where(eq(tables.bookmarks.id, input.bookmark_id))
      .execute();
    const existingBookmark = existingBookmarks[0];
    if (!existingBookmark) {
      throw new Error('Bookmark not found');
    }

    // Insert linking record
    await db
      .insert(tables.bookmarkCollections)
      .values({
        bookmark_id: input.bookmark_id,
        collection_id: input.collection_id,
      })
      .execute();

    // Retrieve the bookmark
    const bookmarks = await db
      .select()
      .from(tables.bookmarks)
      .where(eq(tables.bookmarks.id, input.bookmark_id))
      .execute();

    const bookmark = bookmarks[0];
    if (!bookmark) {
      throw new Error('Bookmark not found');
    }
    return bookmark as Bookmark;
  } catch (error) {
    console.error('Failed to assign collection to bookmark:', error);
    throw error;
  }
};
