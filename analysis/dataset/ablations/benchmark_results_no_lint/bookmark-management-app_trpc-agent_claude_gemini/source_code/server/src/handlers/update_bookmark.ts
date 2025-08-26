import { db } from '../db';
import { bookmarksTable, collectionsTable, tagsTable, bookmarkTagsTable } from '../db/schema';
import { type UpdateBookmarkInput, type BookmarkWithData } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateBookmark = async (input: UpdateBookmarkInput): Promise<BookmarkWithData> => {
  try {
    // First, get the existing bookmark to validate ownership
    const existingBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, input.id))
      .execute();

    if (existingBookmarks.length === 0) {
      throw new Error(`Bookmark with id ${input.id} not found`);
    }

    const existingBookmark = existingBookmarks[0];

    // Build update object with only provided fields
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
      updateData.collection_id = input.collection_id;
    }

    // Update the bookmark
    await db.update(bookmarksTable)
      .set(updateData)
      .where(eq(bookmarksTable.id, input.id))
      .execute();

    // Handle tag associations if provided
    if (input.tag_ids !== undefined) {
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

    // Get the updated bookmark with related data
    const updatedBookmarkQuery = db.select({
      id: bookmarksTable.id,
      url: bookmarksTable.url,
      title: bookmarksTable.title,
      description: bookmarksTable.description,
      user_id: bookmarksTable.user_id,
      collection_id: bookmarksTable.collection_id,
      created_at: bookmarksTable.created_at,
      updated_at: bookmarksTable.updated_at,
      collection_name: collectionsTable.name
    })
    .from(bookmarksTable)
    .leftJoin(collectionsTable, eq(bookmarksTable.collection_id, collectionsTable.id))
    .where(eq(bookmarksTable.id, input.id));

    const updatedBookmarkResults = await updatedBookmarkQuery.execute();
    const updatedBookmark = updatedBookmarkResults[0];

    // Get associated tags
    const tagsQuery = db.select({
      id: tagsTable.id,
      name: tagsTable.name,
      color: tagsTable.color,
      user_id: tagsTable.user_id,
      created_at: tagsTable.created_at
    })
    .from(tagsTable)
    .innerJoin(bookmarkTagsTable, eq(tagsTable.id, bookmarkTagsTable.tag_id))
    .where(eq(bookmarkTagsTable.bookmark_id, input.id));

    const associatedTags = await tagsQuery.execute();

    return {
      id: updatedBookmark.id,
      url: updatedBookmark.url,
      title: updatedBookmark.title,
      description: updatedBookmark.description,
      user_id: updatedBookmark.user_id,
      collection_id: updatedBookmark.collection_id,
      collection_name: updatedBookmark.collection_name,
      tags: associatedTags,
      created_at: updatedBookmark.created_at,
      updated_at: updatedBookmark.updated_at
    };
  } catch (error) {
    console.error('Bookmark update failed:', error);
    throw error;
  }
};
