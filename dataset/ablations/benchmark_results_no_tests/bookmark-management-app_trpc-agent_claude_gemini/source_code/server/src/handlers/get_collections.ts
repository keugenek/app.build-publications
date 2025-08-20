import { db } from '../db';
import { collectionsTable } from '../db/schema';
import { type Collection } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getCollections(userId: number): Promise<Collection[]> {
  try {
    // Fetch all collections for the user, ordered by creation date (newest first)
    const results = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.user_id, userId))
      .orderBy(desc(collectionsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    throw error;
  }
}
