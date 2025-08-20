import { db } from '../db';
import { bookmarksTable } from '../db/schema';
import { type GetUserEntityInput, type Bookmark } from '../schema';
import { eq } from 'drizzle-orm';

export async function getBookmarks(input: GetUserEntityInput): Promise<Bookmark[]> {
  try {
    // Query all bookmarks for the specified user
    const results = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.user_id, input.user_id))
      .execute();

    // Return the bookmarks as-is since all fields are already the correct types
    return results;
  } catch (error) {
    console.error('Get bookmarks failed:', error);
    throw error;
  }
}
