import { db } from '../db';
import { bookmarksTable, bookmarkTagsTable, tagsTable, bookmarkCollectionsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { type UpdateBookmarkInput, type Bookmark } from '../schema';

export const updateBookmark = async (input: UpdateBookmarkInput): Promise<Bookmark> => {
  try {
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Check if the bookmark exists and belongs to the user
      const existingBookmark = await tx.select()
        .from(bookmarksTable)
        .where(and(
          eq(bookmarksTable.id, input.id),
          eq(bookmarksTable.user_id, input.user_id)
        ))
        .execute();

      if (existingBookmark.length === 0) {
        throw new Error('Bookmark not found or does not belong to the user');
      }

      // Prepare the update data
      const updateData: any = {
        updated_at: new Date()
      };

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
      const updatedBookmarks = await tx.update(bookmarksTable)
        .set(updateData)
        .where(eq(bookmarksTable.id, input.id))
        .returning()
        .execute();

      if (updatedBookmarks.length === 0) {
        throw new Error('Failed to update bookmark');
      }

      const updatedBookmark = updatedBookmarks[0];

      // Handle collection association if provided
      if (input.collection_id !== undefined) {
        // Remove any existing collection associations for this bookmark
        await tx.delete(bookmarkCollectionsTable)
          .where(eq(bookmarkCollectionsTable.bookmark_id, input.id))
          .execute();

        // If a collection_id was provided (not null), create new association
        if (input.collection_id !== null) {
          await tx.insert(bookmarkCollectionsTable)
            .values({
              bookmark_id: input.id,
              collection_id: input.collection_id
            })
            .execute();
        }
      }

      // Handle tags if provided
      if (input.tags !== undefined) {
        // First, remove all existing tag associations for this bookmark
        await tx.delete(bookmarkTagsTable)
          .where(eq(bookmarkTagsTable.bookmark_id, input.id))
          .execute();

        // If tags were provided, create new associations
        if (input.tags.length > 0) {
          // Get or create tags
          const tagIds: number[] = [];
          
          for (const tagName of input.tags) {
            // Check if tag already exists for this user
            const existingTags = await tx.select()
              .from(tagsTable)
              .where(and(
                eq(tagsTable.user_id, input.user_id),
                eq(tagsTable.name, tagName)
              ))
              .execute();

            let tagId: number;
            if (existingTags.length > 0) {
              tagId = existingTags[0].id;
            } else {
              // Create new tag
              const newTags = await tx.insert(tagsTable)
                .values({
                  user_id: input.user_id,
                  name: tagName
                })
                .returning({ id: tagsTable.id })
                .execute();
              
              tagId = newTags[0].id;
            }
            tagIds.push(tagId);
          }

          // Create bookmark-tag associations
          const bookmarkTagValues = tagIds.map(tagId => ({
            bookmark_id: input.id,
            tag_id: tagId
          }));

          await tx.insert(bookmarkTagsTable)
            .values(bookmarkTagValues)
            .execute();
        }
      }

      // Get the current collection_id for the bookmark (if any)
      let collectionId: number | null = null;
      if (input.collection_id !== undefined) {
        collectionId = input.collection_id;
      } else {
        // If not specified in update, check if there was an existing association
        const existingCollections = await tx.select()
          .from(bookmarkCollectionsTable)
          .where(eq(bookmarkCollectionsTable.bookmark_id, input.id))
          .execute();
        
        if (existingCollections.length > 0) {
          collectionId = existingCollections[0].collection_id;
        }
      }

      // Return the updated bookmark
      return {
        id: updatedBookmark.id,
        user_id: updatedBookmark.user_id,
        collection_id: collectionId,
        title: updatedBookmark.title,
        url: updatedBookmark.url,
        description: updatedBookmark.description,
        created_at: updatedBookmark.created_at,
        updated_at: updatedBookmark.updated_at
      };
    });
  } catch (error) {
    console.error('Bookmark update failed:', error);
    throw error;
  }
};
