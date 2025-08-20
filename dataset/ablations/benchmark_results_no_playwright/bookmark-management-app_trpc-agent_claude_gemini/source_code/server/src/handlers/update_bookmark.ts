import { db } from '../db';
import { bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type UpdateBookmarkInput, type Bookmark } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBookmark = async (input: UpdateBookmarkInput): Promise<Bookmark> => {
  try {
    // First, verify the bookmark exists
    const existingBookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, input.id))
      .execute();

    if (existingBookmarks.length === 0) {
      throw new Error(`Bookmark with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof bookmarksTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.collection_id !== undefined) {
      updateData.collection_id = input.collection_id;
    }
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.url !== undefined) {
      updateData.url = input.url;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Update the bookmark
    const result = await db.update(bookmarksTable)
      .set(updateData)
      .where(eq(bookmarksTable.id, input.id))
      .returning()
      .execute();

    // Handle tag associations if provided
    if (input.tag_ids !== undefined) {
      // Remove existing tag associations
      await db.delete(bookmarkTagsTable)
        .where(eq(bookmarkTagsTable.bookmark_id, input.id))
        .execute();

      // Add new tag associations
      if (input.tag_ids.length > 0) {
        const tagAssociations = input.tag_ids.map(tag_id => ({
          bookmark_id: input.id,
          tag_id: tag_id
        }));

        await db.insert(bookmarkTagsTable)
          .values(tagAssociations)
          .execute();
      }
    }

    return result[0];
  } catch (error) {
    console.error('Bookmark update failed:', error);
    throw error;
  }
};
