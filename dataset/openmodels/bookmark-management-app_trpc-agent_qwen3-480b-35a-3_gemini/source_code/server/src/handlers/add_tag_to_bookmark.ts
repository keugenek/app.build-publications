import { db } from '../db';
import { bookmarkTagsTable } from '../db/schema';
import { type AddTagToBookmarkInput } from '../schema';

export const addTagToBookmark = async (input: AddTagToBookmarkInput): Promise<void> => {
  try {
    await db.insert(bookmarkTagsTable)
      .values({
        bookmark_id: input.bookmark_id,
        tag_id: input.tag_id,
      })
      .onConflictDoNothing()
      .execute();
  } catch (error) {
    console.error('Failed to add tag to bookmark:', error);
    throw error;
  }
};
