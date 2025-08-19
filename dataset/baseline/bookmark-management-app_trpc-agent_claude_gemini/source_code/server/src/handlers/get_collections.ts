import { db } from '../db';
import { collectionsTable } from '../db/schema';
import { type Collection } from '../schema';
import { eq } from 'drizzle-orm';

export const getCollections = async (userId: number): Promise<Collection[]> => {
  try {
    const result = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.user_id, userId))
      .orderBy(collectionsTable.name)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    throw error;
  }
};
