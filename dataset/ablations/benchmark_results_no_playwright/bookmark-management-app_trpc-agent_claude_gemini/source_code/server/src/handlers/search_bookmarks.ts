import { db } from '../db';
import { bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type SearchBookmarksInput, type Bookmark } from '../schema';
import { eq, and, or, ilike, inArray, sql, SQL } from 'drizzle-orm';

export async function searchBookmarks(input: SearchBookmarksInput): Promise<Bookmark[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Always filter by user_id
    conditions.push(eq(bookmarksTable.user_id, input.user_id));

    // Filter by collection_id if provided
    if (input.collection_id !== undefined) {
      conditions.push(eq(bookmarksTable.collection_id, input.collection_id));
    }

    // Add text search if query is provided
    if (input.query && input.query.trim()) {
      const searchTerm = `%${input.query.trim()}%`;
      conditions.push(
        or(
          ilike(bookmarksTable.title, searchTerm),
          ilike(bookmarksTable.url, searchTerm),
          ilike(bookmarksTable.description, searchTerm)
        )!
      );
    }

    // Handle tag filtering if tag_ids provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      // Use a subquery to find bookmarks that have ALL the specified tags
      const tagBookmarkIds = await db
        .select({ bookmark_id: bookmarkTagsTable.bookmark_id })
        .from(bookmarkTagsTable)
        .where(inArray(bookmarkTagsTable.tag_id, input.tag_ids))
        .groupBy(bookmarkTagsTable.bookmark_id)
        .having(sql`COUNT(DISTINCT tag_id) = ${input.tag_ids.length}`)
        .execute();

      const bookmarkIds = tagBookmarkIds.map(row => row.bookmark_id);
      
      if (bookmarkIds.length > 0) {
        conditions.push(inArray(bookmarksTable.id, bookmarkIds));
      } else {
        // No bookmarks match all tags, return empty result
        return [];
      }
    }

    // Build the main query
    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
    
    const results = await db
      .select()
      .from(bookmarksTable)
      .where(whereClause)
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    return results;
  } catch (error) {
    console.error('Bookmark search failed:', error);
    throw error;
  }
}
