import { db } from '../db';
import { collectionsTable } from '../db/schema';
import { type Collection } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getUserCollections = async (userId: number): Promise<Collection[]> => {
  try {
    // Fetch all collections belonging to the specified user
    // Ordered by creation date (oldest first)
    const results = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.user_id, userId))
      .orderBy(asc(collectionsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch user collections:', error);
    throw error;
  }
};
