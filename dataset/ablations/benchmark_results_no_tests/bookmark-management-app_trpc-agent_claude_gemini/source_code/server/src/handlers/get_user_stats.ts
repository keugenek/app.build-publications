import { db } from '../db';
import { bookmarksTable, collectionsTable, tagsTable } from '../db/schema';
import { type UserStats } from '../schema';
import { eq, count } from 'drizzle-orm';

export async function getUserStats(userId: number): Promise<UserStats> {
  try {
    // Get count of bookmarks for the user
    const bookmarksCount = await db.select({ count: count() })
      .from(bookmarksTable)
      .where(eq(bookmarksTable.user_id, userId))
      .execute();

    // Get count of collections for the user
    const collectionsCount = await db.select({ count: count() })
      .from(collectionsTable)
      .where(eq(collectionsTable.user_id, userId))
      .execute();

    // Get count of tags for the user
    const tagsCount = await db.select({ count: count() })
      .from(tagsTable)
      .where(eq(tagsTable.user_id, userId))
      .execute();

    return {
      user_id: userId,
      total_bookmarks: bookmarksCount[0]?.count || 0,
      total_collections: collectionsCount[0]?.count || 0,
      total_tags: tagsCount[0]?.count || 0
    };
  } catch (error) {
    console.error('Failed to get user stats:', error);
    throw error;
  }
}
