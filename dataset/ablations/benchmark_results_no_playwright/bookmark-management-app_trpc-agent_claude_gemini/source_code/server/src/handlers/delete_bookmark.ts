import { db } from '../db';
import { bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteBookmark = async (input: DeleteEntityInput): Promise<{ success: boolean }> => {
  try {
    // First check if bookmark exists
    const existingBookmark = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.id, input.id))
      .execute();

    if (existingBookmark.length === 0) {
      throw new Error(`Bookmark with id ${input.id} not found`);
    }

    // Delete bookmark (tag relationships will be automatically deleted due to CASCADE)
    await db.delete(bookmarksTable)
      .where(eq(bookmarksTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Bookmark deletion failed:', error);
    throw error;
  }
};
