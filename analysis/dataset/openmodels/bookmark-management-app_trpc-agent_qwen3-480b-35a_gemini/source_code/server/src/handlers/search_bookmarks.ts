import { db } from '../db';
import { bookmarksTable, bookmarkTagsTable, tagsTable } from '../db/schema';
import { type SearchBookmarksInput, type Bookmark } from '../schema';
import { and, eq, ilike, or, inArray } from 'drizzle-orm';

export const searchBookmarks = async (input: SearchBookmarksInput): Promise<Bookmark[]> => {
  try {
    // Base query conditions
    const baseConditions = [
      eq(bookmarksTable.user_id, input.user_id)
    ];

    // If no query, return all bookmarks for the user
    if (!input.query || input.query.trim() === '') {
      const bookmarks = await db.select()
        .from(bookmarksTable)
        .where(and(...baseConditions))
        .execute();

      return bookmarks.map(bookmark => ({
        id: bookmark.id,
        user_id: bookmark.user_id,
        collection_id: null,
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description,
        created_at: bookmark.created_at,
        updated_at: bookmark.updated_at,
      }));
    }

    // For search query, find matching bookmarks
    const searchTerm = `%${input.query.trim()}%`;
    
    // Find tag IDs that match the query
    const tagMatches = await db.select({ id: tagsTable.id })
      .from(tagsTable)
      .where(
        and(
          eq(tagsTable.user_id, input.user_id),
          ilike(tagsTable.name, searchTerm)
        )
      )
      .execute();

    const tagIds = tagMatches.map(tag => tag.id);

    // Find bookmark IDs that have these tags
    let bookmarkIdsFromTags: number[] = [];
    if (tagIds.length > 0) {
      const bookmarkTagMatches = await db.select({ bookmark_id: bookmarkTagsTable.bookmark_id })
        .from(bookmarkTagsTable)
        .where(inArray(bookmarkTagsTable.tag_id, tagIds))
        .execute();

      bookmarkIdsFromTags = bookmarkTagMatches.map(bt => bt.bookmark_id);
    }

    // Build search conditions for bookmarks
    const searchConditions = [
      ilike(bookmarksTable.title, searchTerm),
      ilike(bookmarksTable.description, searchTerm),
      ilike(bookmarksTable.url, searchTerm)
    ];

    // Include bookmarks with matching tags
    if (bookmarkIdsFromTags.length > 0) {
      searchConditions.push(inArray(bookmarksTable.id, bookmarkIdsFromTags));
    }

    // Combine all conditions
    const allConditions = [
      ...baseConditions,
      or(...searchConditions)
    ];

    // Execute query
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(and(...allConditions))
      .execute();

    // Convert to expected return type
    return bookmarks.map(bookmark => ({
      id: bookmark.id,
      user_id: bookmark.user_id,
      collection_id: null,
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description,
      created_at: bookmark.created_at,
      updated_at: bookmark.updated_at,
    }));
  } catch (error) {
    console.error('Search bookmarks failed:', error);
    throw error;
  }
};
