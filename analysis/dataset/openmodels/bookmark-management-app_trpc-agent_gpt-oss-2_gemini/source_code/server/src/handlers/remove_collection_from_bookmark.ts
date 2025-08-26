import { db } from '../db';
import { bookmarks, collections, bookmarkCollections } from '../db/schema';
import { type AssignCollectionToBookmarkInput, type Bookmark } from '../schema';
import { eq, and } from 'drizzle-orm';

/**
 * Removes the association between a collection and a bookmark.
 * Deletes the linking row from `bookmark_collections` and returns the updated bookmark.
 */
export const removeCollectionFromBookmark = async (
  input: AssignCollectionToBookmarkInput,
): Promise<Bookmark> => {
  try {
    // Delete the linking record
    await db
      .delete(bookmarkCollections)
      .where(
        and(
          eq(bookmarkCollections.bookmark_id, input.bookmark_id),
          eq(bookmarkCollections.collection_id, input.collection_id),
        ),
      )
      .execute();

    // Fetch the bookmark after removal
    const bookmarkResult = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.id, input.bookmark_id))
      .limit(1)
      .execute();

    if (bookmarkResult.length === 0) {
      throw new Error('Bookmark not found');
    }

    const bm = bookmarkResult[0];
    return {
      id: bm.id,
      url: bm.url,
      title: bm.title,
      description: bm.description ?? null,
      created_at: bm.created_at,
      user_id: bm.user_id ?? null,
    } as Bookmark;
  } catch (error) {
    console.error('Failed to remove collection from bookmark:', error);
    throw error;
  }
};
