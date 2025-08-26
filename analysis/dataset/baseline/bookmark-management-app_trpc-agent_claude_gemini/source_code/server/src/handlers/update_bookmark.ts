import { db } from '../db';
import { bookmarksTable, bookmarkTagsTable, tagsTable, collectionsTable } from '../db/schema';
import { type UpdateBookmarkInput, type BookmarkWithDetails } from '../schema';
import { eq, and, inArray } from 'drizzle-orm';

export const updateBookmark = async (input: UpdateBookmarkInput): Promise<BookmarkWithDetails | null> => {
  try {
    // First, check if the bookmark exists and get the user_id for validation
    const existingBookmark = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, input.id))
      .execute();

    if (existingBookmark.length === 0) {
      return null; // Bookmark not found
    }

    const bookmark = existingBookmark[0];

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.url !== undefined) {
      updateData.url = input.url;
    }
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.collection_id !== undefined) {
      // Validate collection exists and belongs to the same user
      if (input.collection_id !== null) {
        const collection = await db.select()
          .from(collectionsTable)
          .where(and(
            eq(collectionsTable.id, input.collection_id),
            eq(collectionsTable.user_id, bookmark.user_id)
          ))
          .execute();

        if (collection.length === 0) {
          throw new Error('Collection not found or does not belong to user');
        }
      }
      updateData.collection_id = input.collection_id;
    }

    // Update the bookmark
    const updatedBookmarks = await db.update(bookmarksTable)
      .set(updateData)
      .where(eq(bookmarksTable.id, input.id))
      .returning()
      .execute();

    const updatedBookmark = updatedBookmarks[0];

    // Handle tag associations if provided
    if (input.tag_ids !== undefined) {
      // Validate all tags exist and belong to the same user
      if (input.tag_ids.length > 0) {
        const validTags = await db.select()
          .from(tagsTable)
          .where(and(
            inArray(tagsTable.id, input.tag_ids),
            eq(tagsTable.user_id, bookmark.user_id)
          ))
          .execute();

        if (validTags.length !== input.tag_ids.length) {
          throw new Error('One or more tags not found or do not belong to user');
        }
      }

      // Remove existing tag associations
      await db.delete(bookmarkTagsTable)
        .where(eq(bookmarkTagsTable.bookmark_id, input.id))
        .execute();

      // Add new tag associations
      if (input.tag_ids.length > 0) {
        const tagAssociations = input.tag_ids.map(tagId => ({
          bookmark_id: input.id,
          tag_id: tagId
        }));

        await db.insert(bookmarkTagsTable)
          .values(tagAssociations)
          .execute();
      }
    }

    // Fetch the complete bookmark with details
    const bookmarkWithDetailsQuery = db.select({
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
      .where(eq(bookmarksTable.id, input.id));

    const bookmarkResult = await bookmarkWithDetailsQuery.execute();
    const bookmarkData = bookmarkResult[0];

    // Fetch associated tags
    const tagsQuery = db.select({
      id: tagsTable.id,
      name: tagsTable.name,
      user_id: tagsTable.user_id,
      created_at: tagsTable.created_at,
    })
      .from(tagsTable)
      .innerJoin(bookmarkTagsTable, eq(tagsTable.id, bookmarkTagsTable.tag_id))
      .where(eq(bookmarkTagsTable.bookmark_id, input.id));

    const tags = await tagsQuery.execute();

    return {
      id: bookmarkData.id,
      url: bookmarkData.url,
      title: bookmarkData.title,
      description: bookmarkData.description,
      user_id: bookmarkData.user_id,
      collection_id: bookmarkData.collection_id,
      collection_name: bookmarkData.collection_name,
      tags: tags,
      created_at: bookmarkData.created_at,
      updated_at: bookmarkData.updated_at,
    };

  } catch (error) {
    console.error('Bookmark update failed:', error);
    throw error;
  }
};
