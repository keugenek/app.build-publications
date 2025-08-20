import { db } from '../db';
import { bookmarksTable, collectionsTable, tagsTable, bookmarkTagsTable } from '../db/schema';
import { type BookmarkWithData } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getBookmarkById = async (bookmarkId: number, userId: number): Promise<BookmarkWithData | null> => {
  try {
    // First, get the bookmark with collection data
    const bookmarkResults = await db.select({
      id: bookmarksTable.id,
      url: bookmarksTable.url,
      title: bookmarksTable.title,
      description: bookmarksTable.description,
      user_id: bookmarksTable.user_id,
      collection_id: bookmarksTable.collection_id,
      created_at: bookmarksTable.created_at,
      updated_at: bookmarksTable.updated_at,
      collection_name: collectionsTable.name,
    })
    .from(bookmarksTable)
    .leftJoin(collectionsTable, eq(bookmarksTable.collection_id, collectionsTable.id))
    .where(and(
      eq(bookmarksTable.id, bookmarkId),
      eq(bookmarksTable.user_id, userId)
    ))
    .execute();

    if (bookmarkResults.length === 0) {
      return null;
    }

    const bookmark = bookmarkResults[0];

    // Get associated tags
    const tagResults = await db.select({
      id: tagsTable.id,
      name: tagsTable.name,
      color: tagsTable.color,
      user_id: tagsTable.user_id,
      created_at: tagsTable.created_at,
    })
    .from(bookmarkTagsTable)
    .innerJoin(tagsTable, eq(bookmarkTagsTable.tag_id, tagsTable.id))
    .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
    .execute();

    return {
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      user_id: bookmark.user_id,
      collection_id: bookmark.collection_id,
      collection_name: bookmark.collection_name,
      tags: tagResults,
      created_at: bookmark.created_at,
      updated_at: bookmark.updated_at,
    };
  } catch (error) {
    console.error('Failed to get bookmark by ID:', error);
    throw error;
  }
};
