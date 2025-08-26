import { db } from '../db';
import { bookmarkTagsTable } from '../db/schema';
import { type AddTagToBookmarkInput, type BookmarkTag } from '../schema';

export const addTagToBookmark = async (input: AddTagToBookmarkInput): Promise<BookmarkTag> => {
  try {
    // Insert the bookmark-tag association
    const result = await db.insert(bookmarkTagsTable)
      .values({
        bookmark_id: input.bookmark_id,
        tag_id: input.tag_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Failed to add tag to bookmark:', error);
    throw error;
  }
};
