import { db } from '../db';
import { bookmarksTable, tagsTable, collectionsTable, bookmarkTagsTable, bookmarkCollectionsTable } from '../db/schema';
import { type SearchBookmarksInput, type Bookmark } from '../schema';
import { ilike, or, and, eq } from 'drizzle-orm';

export const searchBookmarks = async (input: SearchBookmarksInput): Promise<Bookmark[]> => {
  try {
    // Create the search term with wildcards for partial matching
    const searchTerm = `%${input.query}%`;

    // Base query to search bookmarks by title, URL, or description
    const query = db.select({
      id: bookmarksTable.id,
      user_id: bookmarksTable.user_id,
      url: bookmarksTable.url,
      title: bookmarksTable.title,
      description: bookmarksTable.description,
      created_at: bookmarksTable.created_at,
      updated_at: bookmarksTable.updated_at
    })
    .from(bookmarksTable)
    .leftJoin(bookmarkTagsTable, eq(bookmarksTable.id, bookmarkTagsTable.bookmark_id))
    .leftJoin(tagsTable, eq(bookmarkTagsTable.tag_id, tagsTable.id))
    .leftJoin(bookmarkCollectionsTable, eq(bookmarksTable.id, bookmarkCollectionsTable.bookmark_id))
    .leftJoin(collectionsTable, eq(bookmarkCollectionsTable.collection_id, collectionsTable.id))
    .where(
      or(
        ilike(bookmarksTable.title, searchTerm),
        ilike(bookmarksTable.url, searchTerm),
        ilike(bookmarksTable.description, searchTerm),
        ilike(tagsTable.name, searchTerm),
        ilike(collectionsTable.name, searchTerm)
      )
    )
    .groupBy(
      bookmarksTable.id,
      bookmarksTable.user_id,
      bookmarksTable.url,
      bookmarksTable.title,
      bookmarksTable.description,
      bookmarksTable.created_at,
      bookmarksTable.updated_at
    )
    .orderBy(bookmarksTable.created_at);

    const results = await query.execute();

    return results.map(bookmark => ({
      ...bookmark,
      description: bookmark.description ?? null,
      created_at: new Date(bookmark.created_at),
      updated_at: new Date(bookmark.updated_at)
    }));
  } catch (error) {
    console.error('Bookmark search failed:', error);
    throw error;
  }
};
