import { db } from '../db';
import { bookmarksTable, collectionsTable, tagsTable, bookmarkTagsTable } from '../db/schema';
import { type SearchBookmarksInput, type BookmarkWithDetails } from '../schema';
import { eq, and, or, ilike, inArray, SQL } from 'drizzle-orm';

export async function searchBookmarks(input: SearchBookmarksInput): Promise<BookmarkWithDetails[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Always filter by user_id
    conditions.push(eq(bookmarksTable.user_id, input.user_id));

    // Add full-text search across title and description
    const searchQuery = `%${input.query}%`;
    conditions.push(
      or(
        ilike(bookmarksTable.title, searchQuery),
        ilike(bookmarksTable.description, searchQuery)
      )!
    );

    // Filter by collection if provided
    if (input.collection_id !== undefined) {
      conditions.push(eq(bookmarksTable.collection_id, input.collection_id));
    }

    // Filter by tags if provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      // Get bookmark IDs that have any of the specified tags
      const bookmarkIdsWithTags = await db.select({ bookmark_id: bookmarkTagsTable.bookmark_id })
        .from(bookmarkTagsTable)
        .where(inArray(bookmarkTagsTable.tag_id, input.tag_ids))
        .execute();

      const bookmarkIds = bookmarkIdsWithTags.map(row => row.bookmark_id);
      
      if (bookmarkIds.length > 0) {
        conditions.push(
          inArray(bookmarksTable.id, bookmarkIds)
        );
      } else {
        // No bookmarks found with specified tags, return empty result
        return [];
      }
    }

    // Build the query with joins and conditions
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
    .where(conditions.length === 1 ? conditions[0] : and(...conditions));

    const results = await query.execute();

    // Get unique bookmark IDs from results
    const bookmarkIds = results.map(result => result.id);
    
    if (bookmarkIds.length === 0) {
      return [];
    }

    // Fetch all tags for the found bookmarks
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
    bookmarkTagsResults.forEach(result => {
      if (!tagsByBookmark.has(result.bookmark_id)) {
        tagsByBookmark.set(result.bookmark_id, []);
      }
      tagsByBookmark.get(result.bookmark_id)!.push({
        id: result.tag_id,
        name: result.tag_name,
        user_id: result.tag_user_id,
        created_at: result.tag_created_at,
      });
    });

    // Combine bookmark data with tags
    return results.map(result => ({
      id: result.id,
      url: result.url,
      title: result.title,
      description: result.description,
      user_id: result.user_id,
      collection_id: result.collection_id,
      collection_name: result.collection_name,
      tags: tagsByBookmark.get(result.id) || [],
      created_at: result.created_at,
      updated_at: result.updated_at,
    }));
  } catch (error) {
    console.error('Bookmark search failed:', error);
    throw error;
  }
}
