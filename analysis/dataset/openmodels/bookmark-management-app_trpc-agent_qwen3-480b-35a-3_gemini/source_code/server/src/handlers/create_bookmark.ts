import { db } from '../db';
import { bookmarksTable, bookmarkTagsTable, bookmarkCollectionsTable } from '../db/schema';
import { type CreateBookmarkInput, type Bookmark } from '../schema';

// For this implementation, we'll use a fixed user ID since we don't have auth context
// In a real application, this would come from the request context
const DEFAULT_USER_ID = 1;

export const createBookmark = async (input: CreateBookmarkInput): Promise<Bookmark> => {
  try {
    // Insert bookmark record
    const result = await db.insert(bookmarksTable)
      .values({
        user_id: DEFAULT_USER_ID,
        url: input.url,
        title: input.title,
        description: input.description
      })
      .returning()
      .execute();

    const bookmark = result[0];

    // Handle tag associations if provided
    if (input.tagIds && input.tagIds.length > 0) {
      const tagAssociations = input.tagIds.map(tagId => ({
        bookmark_id: bookmark.id,
        tag_id: tagId
      }));

      await db.insert(bookmarkTagsTable)
        .values(tagAssociations)
        .onConflictDoNothing()
        .execute();
    }

    // Handle collection associations if provided
    if (input.collectionIds && input.collectionIds.length > 0) {
      const collectionAssociations = input.collectionIds.map(collectionId => ({
        bookmark_id: bookmark.id,
        collection_id: collectionId
      }));

      await db.insert(bookmarkCollectionsTable)
        .values(collectionAssociations)
        .onConflictDoNothing()
        .execute();
    }

    return {
      id: bookmark.id,
      user_id: bookmark.user_id,
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      created_at: bookmark.created_at,
      updated_at: bookmark.updated_at
    };
  } catch (error) {
    console.error('Bookmark creation failed:', error);
    throw error;
  }
};
