import { db } from '../db';
import { bookmarksTable, collectionsTable, tagsTable, bookmarkTagsTable } from '../db/schema';
import { type SearchBookmarksInput, type BookmarkWithData } from '../schema';
import { eq, and, or, ilike, inArray, desc, type SQL } from 'drizzle-orm';

export const searchBookmarks = async (input: SearchBookmarksInput): Promise<BookmarkWithData[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Always filter by user_id
    conditions.push(eq(bookmarksTable.user_id, input.user_id));

    // Add text search condition if query provided
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

    // Add collection filter if specified
    if (input.collection_id !== undefined) {
      conditions.push(eq(bookmarksTable.collection_id, input.collection_id));
    }

    // Handle tag filtering - requires subquery
    if (input.tag_ids && input.tag_ids.length > 0) {
      const bookmarkIdsWithTags = db.select({ bookmark_id: bookmarkTagsTable.bookmark_id })
        .from(bookmarkTagsTable)
        .where(inArray(bookmarkTagsTable.tag_id, input.tag_ids));

      conditions.push(
        inArray(bookmarksTable.id, bookmarkIdsWithTags)
      );
    }

    // Build the main query with joins
    const limit = input.limit || 50;
    const offset = input.offset || 0;

    const bookmarkResults = await db.select({
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
    .where(conditions.length === 1 ? conditions[0] : and(...conditions))
    .orderBy(desc(bookmarksTable.created_at))
    .limit(limit)
    .offset(offset)
    .execute();

    // If no bookmarks found, return empty array
    if (bookmarkResults.length === 0) {
      return [];
    }

    // Get all bookmark IDs to fetch their tags
    const bookmarkIds = bookmarkResults.map(bookmark => bookmark.id);

    // Fetch all tags for these bookmarks
    const tagResults = await db.select({
      bookmark_id: bookmarkTagsTable.bookmark_id,
      tag_id: tagsTable.id,
      tag_name: tagsTable.name,
      tag_color: tagsTable.color,
      tag_user_id: tagsTable.user_id,
      tag_created_at: tagsTable.created_at,
    })
    .from(bookmarkTagsTable)
    .innerJoin(tagsTable, eq(bookmarkTagsTable.tag_id, tagsTable.id))
    .where(inArray(bookmarkTagsTable.bookmark_id, bookmarkIds))
    .execute();

    // Group tags by bookmark_id
    const tagsByBookmark = tagResults.reduce((acc, tagResult) => {
      if (!acc[tagResult.bookmark_id]) {
        acc[tagResult.bookmark_id] = [];
      }
      acc[tagResult.bookmark_id].push({
        id: tagResult.tag_id,
        name: tagResult.tag_name,
        color: tagResult.tag_color,
        user_id: tagResult.tag_user_id,
        created_at: tagResult.tag_created_at,
      });
      return acc;
    }, {} as Record<number, Array<{
      id: number;
      name: string;
      color: string | null;
      user_id: number;
      created_at: Date;
    }>>);

    // Combine bookmarks with their tags
    return bookmarkResults.map(bookmark => ({
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      user_id: bookmark.user_id,
      collection_id: bookmark.collection_id,
      collection_name: bookmark.collection_name,
      tags: tagsByBookmark[bookmark.id] || [],
      created_at: bookmark.created_at,
      updated_at: bookmark.updated_at,
    }));
  } catch (error) {
    console.error('Bookmark search failed:', error);
    throw error;
  }
};
