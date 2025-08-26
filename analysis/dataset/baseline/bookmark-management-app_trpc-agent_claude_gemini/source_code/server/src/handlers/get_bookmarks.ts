import { db } from '../db';
import { bookmarksTable, collectionsTable, bookmarkTagsTable, tagsTable } from '../db/schema';
import { type BookmarkWithDetails } from '../schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function getBookmarks(userId: number, collectionId?: number): Promise<BookmarkWithDetails[]> {
  try {
    // Build conditions array
    const conditions = [eq(bookmarksTable.user_id, userId)];

    if (collectionId !== undefined) {
      conditions.push(eq(bookmarksTable.collection_id, collectionId));
    }

    // Base query for bookmarks with optional collection join and where clause
    const query = db.select({
      id: bookmarksTable.id,
      url: bookmarksTable.url,
      title: bookmarksTable.title,
      description: bookmarksTable.description,
      user_id: bookmarksTable.user_id,
      collection_id: bookmarksTable.collection_id,
      collection_name: collectionsTable.name,
      created_at: bookmarksTable.created_at,
      updated_at: bookmarksTable.updated_at,
    })
    .from(bookmarksTable)
    .leftJoin(collectionsTable, eq(bookmarksTable.collection_id, collectionsTable.id))
    .where(and(...conditions));

    const bookmarkResults = await query.execute();

    // If no bookmarks found, return empty array
    if (bookmarkResults.length === 0) {
      return [];
    }

    // Get bookmark IDs for tag lookup
    const bookmarkIds = bookmarkResults.map(b => b.id);

    // Fetch all tags for these bookmarks in a single query
    const bookmarkTagsResults = await db.select({
      bookmark_id: bookmarkTagsTable.bookmark_id,
      tag_id: tagsTable.id,
      tag_name: tagsTable.name,
      tag_user_id: tagsTable.user_id,
      tag_created_at: tagsTable.created_at,
    })
    .from(bookmarkTagsTable)
    .innerJoin(tagsTable, eq(bookmarkTagsTable.tag_id, tagsTable.id))
    .where(inArray(bookmarkTagsTable.bookmark_id, bookmarkIds))
    .execute();

    // Group tags by bookmark_id
    const tagsByBookmark = new Map<number, any[]>();
    for (const tagResult of bookmarkTagsResults) {
      const bookmarkId = tagResult.bookmark_id;
      if (!tagsByBookmark.has(bookmarkId)) {
        tagsByBookmark.set(bookmarkId, []);
      }
      tagsByBookmark.get(bookmarkId)!.push({
        id: tagResult.tag_id,
        name: tagResult.tag_name,
        user_id: tagResult.tag_user_id,
        created_at: tagResult.tag_created_at,
      });
    }

    // Combine bookmarks with their tags
    return bookmarkResults.map(bookmark => ({
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      user_id: bookmark.user_id,
      collection_id: bookmark.collection_id,
      collection_name: bookmark.collection_name,
      tags: tagsByBookmark.get(bookmark.id) || [],
      created_at: bookmark.created_at,
      updated_at: bookmark.updated_at,
    }));
  } catch (error) {
    console.error('Getting bookmarks failed:', error);
    throw error;
  }
}
