import { db } from '../db';
import { bookmarksTable, bookmarkTagsTable, collectionsTable, tagsTable } from '../db/schema';
import { type UpdateBookmarkInput, type Bookmark } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateBookmark = async (input: UpdateBookmarkInput): Promise<Bookmark | null> => {
  try {
    // First, verify the bookmark exists and get current data
    const existingBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, input.id))
      .execute();

    if (existingBookmarks.length === 0) {
      return null;
    }

    const existingBookmark = existingBookmarks[0];

    // If collection_id is being updated, verify it exists and belongs to the same user
    if (input.collection_id !== undefined && input.collection_id !== null) {
      const collections = await db.select()
        .from(collectionsTable)
        .where(
          and(
            eq(collectionsTable.id, input.collection_id),
            eq(collectionsTable.user_id, existingBookmark.user_id)
          )
        )
        .execute();

      if (collections.length === 0) {
        throw new Error('Collection not found or does not belong to user');
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.collection_id !== undefined) {
      updateData.collection_id = input.collection_id;
    }
    if (input.url !== undefined) {
      updateData.url = input.url;
    }
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.favicon_url !== undefined) {
      updateData.favicon_url = input.favicon_url;
    }

    // Update the bookmark
    const updatedBookmarks = await db.update(bookmarksTable)
      .set(updateData)
      .where(eq(bookmarksTable.id, input.id))
      .returning()
      .execute();

    const updatedBookmark = updatedBookmarks[0];

    // Handle tag updates if provided
    if (input.tag_ids !== undefined) {
      // Verify all tags exist and belong to the same user
      if (input.tag_ids.length > 0) {
        const existingTags = await db.select()
          .from(tagsTable)
          .where(
            and(
              eq(tagsTable.user_id, existingBookmark.user_id)
            )
          )
          .execute();

        const existingTagIds = new Set(existingTags.map(tag => tag.id));
        const invalidTagIds = input.tag_ids.filter(tagId => !existingTagIds.has(tagId));

        if (invalidTagIds.length > 0) {
          throw new Error(`Tags not found or do not belong to user: ${invalidTagIds.join(', ')}`);
        }
      }

      // Remove existing bookmark-tag relationships
      await db.delete(bookmarkTagsTable)
        .where(eq(bookmarkTagsTable.bookmark_id, input.id))
        .execute();

      // Add new bookmark-tag relationships
      if (input.tag_ids.length > 0) {
        const bookmarkTagInserts = input.tag_ids.map(tagId => ({
          bookmark_id: input.id,
          tag_id: tagId
        }));

        await db.insert(bookmarkTagsTable)
          .values(bookmarkTagInserts)
          .execute();
      }
    }

    return updatedBookmark;
  } catch (error) {
    console.error('Bookmark update failed:', error);
    throw error;
  }
};
