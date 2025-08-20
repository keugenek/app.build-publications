import { type AssignTagInput } from '../schema';
import { db } from '../db';
import { bookmarkTagsTable } from '../db/schema';

/** Assign a tag to a bookmark by inserting a row into the bookmark_tags junction table. */
export const assignTag = async (input: AssignTagInput): Promise<{ success: boolean }> => {
  try {
    await db
      .insert(bookmarkTagsTable)
      .values({
        bookmark_id: input.bookmark_id,
        tag_id: input.tag_id,
      })
      .execute();
    return { success: true };
  } catch (error) {
    console.error('Assign tag failed:', error);
    throw error;
  }
};
