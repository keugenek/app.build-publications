import { db } from '../db';
import { bookmarkCollectionsTable } from '../db/schema';
import { type AddBookmarkToCollectionInput, type BookmarkCollection } from '../schema';

export const addBookmarkToCollection = async (input: AddBookmarkToCollectionInput): Promise<BookmarkCollection> => {
  try {
    // Insert the bookmark-collection relationship
    const result = await db.insert(bookmarkCollectionsTable)
      .values({
        bookmark_id: input.bookmark_id,
        collection_id: input.collection_id
      })
      .returning()
      .execute();

    // Return the created relationship
    return result[0];
  } catch (error) {
    console.error('Failed to add bookmark to collection:', error);
    throw error;
  }
};
