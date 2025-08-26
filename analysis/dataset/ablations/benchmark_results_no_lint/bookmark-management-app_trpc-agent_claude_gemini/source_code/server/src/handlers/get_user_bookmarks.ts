import { db } from '../db';
import { bookmarksTable, collectionsTable, bookmarkTagsTable, tagsTable } from '../db/schema';
import { type BookmarkWithData } from '../schema';
import { eq, desc, sql, inArray } from 'drizzle-orm';

export const getUserBookmarks = async (userId: number): Promise<BookmarkWithData[]> => {
  try {
    // First, get all bookmarks for the user with collection info
    const bookmarksWithCollections = await db
      .select({
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
      .where(eq(bookmarksTable.user_id, userId))
      .orderBy(desc(sql`GREATEST(${bookmarksTable.created_at}, ${bookmarksTable.updated_at})`))
      .execute();

    // Get all bookmark IDs to fetch their tags
    const bookmarkIds = bookmarksWithCollections.map(b => b.id);
    
    if (bookmarkIds.length === 0) {
      return [];
    }

    // Get all tags for these bookmarks
    const bookmarkTagsData = await db
      .select({
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

    // Group tags by bookmark ID
    const tagsByBookmarkId: Record<number, any[]> = {};
    bookmarkTagsData.forEach(tagData => {
      if (!tagsByBookmarkId[tagData.bookmark_id]) {
        tagsByBookmarkId[tagData.bookmark_id] = [];
      }
      tagsByBookmarkId[tagData.bookmark_id].push({
        id: tagData.tag_id,
        name: tagData.tag_name,
        color: tagData.tag_color,
        user_id: tagData.tag_user_id,
        created_at: tagData.tag_created_at,
      });
    });

    // Combine bookmarks with their tags
    return bookmarksWithCollections.map(bookmark => ({
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      user_id: bookmark.user_id,
      collection_id: bookmark.collection_id,
      collection_name: bookmark.collection_name,
      tags: tagsByBookmarkId[bookmark.id] || [],
      created_at: bookmark.created_at,
      updated_at: bookmark.updated_at,
    }));
  } catch (error) {
    console.error('Failed to get user bookmarks:', error);
    throw error;
  }
};
