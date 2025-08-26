import { db } from '../db';
import { bookmarksTable } from '../db/schema';
import { type Bookmark } from '../schema';
import { eq, and, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getBookmarks(userId: number, collectionId?: number): Promise<Bookmark[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [eq(bookmarksTable.user_id, userId)];

    // Add collection filter if provided
    if (collectionId !== undefined) {
      conditions.push(eq(bookmarksTable.collection_id, collectionId));
    }

    // Build and execute query
    const results = await db.select()
      .from(bookmarksTable)
      .where(and(...conditions))
      .orderBy(desc(bookmarksTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get bookmarks:', error);
    throw error;
  }
}
