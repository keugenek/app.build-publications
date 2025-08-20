import { db } from '../db';
import { bookmarksTable, collectionsTable, tagsTable, bookmarkTagsTable } from '../db/schema';
import { type SearchBookmarksInput, type BookmarkWithRelations } from '../schema';
import { eq, and, or, ilike, inArray, SQL, desc, count, isNull } from 'drizzle-orm';

export const searchBookmarks = async (input: SearchBookmarksInput): Promise<BookmarkWithRelations[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [
      eq(bookmarksTable.user_id, input.user_id)
    ];

    // Add text search conditions if query is provided
    if (input.query && input.query.trim()) {
      const searchQuery = `%${input.query.trim()}%`;
      conditions.push(
        or(
          ilike(bookmarksTable.title, searchQuery),
          ilike(bookmarksTable.url, searchQuery),
          ilike(bookmarksTable.description, searchQuery),
          ilike(tagsTable.name, searchQuery)
        )!
      );
    }

    // Add collection filter if specified
    if (input.collection_id !== undefined) {
      conditions.push(eq(bookmarksTable.collection_id, input.collection_id));
    }

    // Add tag filter if specified
    if (input.tag_ids && input.tag_ids.length > 0) {
      // Get bookmark IDs that have ALL specified tags
      const bookmarkIdsWithTags = await db
        .select({ bookmark_id: bookmarkTagsTable.bookmark_id })
        .from(bookmarkTagsTable)
        .where(inArray(bookmarkTagsTable.tag_id, input.tag_ids))
        .groupBy(bookmarkTagsTable.bookmark_id)
        .having(eq(count(), input.tag_ids.length))
        .execute();

      const bookmarkIds = bookmarkIdsWithTags.map(row => row.bookmark_id);
      
      if (bookmarkIds.length > 0) {
        conditions.push(inArray(bookmarksTable.id, bookmarkIds));
      } else {
        // No bookmarks have all specified tags, return empty result
        return [];
      }
    }

    // Build the main query with joins
    const results = await db
      .select({
        bookmark: bookmarksTable,
        collection: collectionsTable,
        tag: tagsTable
      })
      .from(bookmarksTable)
      .leftJoin(collectionsTable, eq(bookmarksTable.collection_id, collectionsTable.id))
      .leftJoin(bookmarkTagsTable, eq(bookmarksTable.id, bookmarkTagsTable.bookmark_id))
      .leftJoin(tagsTable, eq(bookmarkTagsTable.tag_id, tagsTable.id))
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(bookmarksTable.created_at), bookmarksTable.id)
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    // Group results by bookmark to handle multiple tags per bookmark
    const bookmarkMap = new Map<number, BookmarkWithRelations>();

    for (const result of results) {
      const bookmark = result.bookmark;
      const collection = result.collection;
      const tag = result.tag;

      if (!bookmarkMap.has(bookmark.id)) {
        bookmarkMap.set(bookmark.id, {
          id: bookmark.id,
          user_id: bookmark.user_id,
          collection_id: bookmark.collection_id,
          url: bookmark.url,
          title: bookmark.title,
          description: bookmark.description,
          favicon_url: bookmark.favicon_url,
          created_at: bookmark.created_at,
          updated_at: bookmark.updated_at,
          collection: collection || null,
          tags: []
        });
      }

      // Add unique tags to the bookmark
      const bookmarkWithRelations = bookmarkMap.get(bookmark.id)!;
      if (tag && !bookmarkWithRelations.tags!.find(t => t.id === tag.id)) {
        bookmarkWithRelations.tags!.push(tag);
      }
    }

    // Convert map to array and maintain ordering
    const bookmarkResults = Array.from(bookmarkMap.values());
    
    // Sort by created_at descending to maintain consistent ordering
    bookmarkResults.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return bookmarkResults;
  } catch (error) {
    console.error('Search bookmarks failed:', error);
    throw error;
  }
};
