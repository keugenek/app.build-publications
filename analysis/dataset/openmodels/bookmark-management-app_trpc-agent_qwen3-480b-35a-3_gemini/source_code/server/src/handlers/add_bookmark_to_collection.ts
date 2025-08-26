import { db } from '../db';
import { bookmarkCollectionsTable } from '../db/schema';
import { type AddBookmarkToCollectionInput } from '../schema';

export const addBookmarkToCollection = async (input: AddBookmarkToCollectionInput): Promise<void> => {
  try {
    await db.insert(bookmarkCollectionsTable)
      .values({
        bookmark_id: input.bookmark_id,
        collection_id: input.collection_id
      })
      .onConflictDoNothing()
      .execute();
  } catch (error) {
    console.error('Failed to add bookmark to collection:', error);
    throw error;
  }
};
