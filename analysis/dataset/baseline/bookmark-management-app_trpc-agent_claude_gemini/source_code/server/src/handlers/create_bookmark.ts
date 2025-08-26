import { db } from '../db';
import { bookmarksTable, bookmarkTagsTable, collectionsTable, tagsTable } from '../db/schema';
import { type CreateBookmarkInput, type BookmarkWithDetails } from '../schema';
import { eq, and, inArray } from 'drizzle-orm';

export const createBookmark = async (input: CreateBookmarkInput): Promise<BookmarkWithDetails> => {
  try {
    // Validate collection belongs to user if provided
    if (input.collection_id) {
      const collection = await db.select()
        .from(collectionsTable)
        .where(
          and(
            eq(collectionsTable.id, input.collection_id),
            eq(collectionsTable.user_id, input.user_id)
          )
        )
        .execute();

      if (collection.length === 0) {
        throw new Error('Collection not found or does not belong to user');
      }
    }

    // Validate all tag_ids belong to user if provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      const userTags = await db.select()
        .from(tagsTable)
        .where(
          and(
            inArray(tagsTable.id, input.tag_ids),
            eq(tagsTable.user_id, input.user_id)
          )
        )
        .execute();

      if (userTags.length !== input.tag_ids.length) {
        throw new Error('One or more tags not found or do not belong to user');
      }
    }

    // Create the bookmark
    const bookmarkResult = await db.insert(bookmarksTable)
      .values({
        url: input.url,
        title: input.title,
        description: input.description,
        user_id: input.user_id,
        collection_id: input.collection_id
      })
      .returning()
      .execute();

    const bookmark = bookmarkResult[0];

    // Create bookmark-tag associations if tags provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      const bookmarkTagValues = input.tag_ids.map(tag_id => ({
        bookmark_id: bookmark.id,
        tag_id
      }));

      await db.insert(bookmarkTagsTable)
        .values(bookmarkTagValues)
        .execute();
    }

    // Fetch the complete bookmark with details
    const completeBookmark = await getBookmarkWithDetails(bookmark.id);
    return completeBookmark;
  } catch (error) {
    console.error('Bookmark creation failed:', error);
    throw error;
  }
};

// Helper function to fetch bookmark with complete details
const getBookmarkWithDetails = async (bookmarkId: number): Promise<BookmarkWithDetails> => {
  // First get the bookmark with collection info
  const bookmarkQuery = await db.select({
    id: bookmarksTable.id,
    url: bookmarksTable.url,
    title: bookmarksTable.title,
    description: bookmarksTable.description,
    user_id: bookmarksTable.user_id,
    collection_id: bookmarksTable.collection_id,
    collection_name: collectionsTable.name,
    created_at: bookmarksTable.created_at,
    updated_at: bookmarksTable.updated_at
  })
    .from(bookmarksTable)
    .leftJoin(collectionsTable, eq(bookmarksTable.collection_id, collectionsTable.id))
    .where(eq(bookmarksTable.id, bookmarkId))
    .execute();

  if (bookmarkQuery.length === 0) {
    throw new Error('Bookmark not found');
  }

  const bookmarkData = bookmarkQuery[0];

  // Get associated tags
  const tagsQuery = await db.select({
    id: tagsTable.id,
    name: tagsTable.name,
    user_id: tagsTable.user_id,
    created_at: tagsTable.created_at
  })
    .from(tagsTable)
    .innerJoin(bookmarkTagsTable, eq(tagsTable.id, bookmarkTagsTable.tag_id))
    .where(eq(bookmarkTagsTable.bookmark_id, bookmarkId))
    .execute();

  return {
    id: bookmarkData.id,
    url: bookmarkData.url,
    title: bookmarkData.title,
    description: bookmarkData.description,
    user_id: bookmarkData.user_id,
    collection_id: bookmarkData.collection_id,
    collection_name: bookmarkData.collection_name,
    tags: tagsQuery,
    created_at: bookmarkData.created_at,
    updated_at: bookmarkData.updated_at
  };
};
