import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type Tag } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getTags = async (userId: number): Promise<Tag[]> => {
  try {
    const results = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.user_id, userId))
      .orderBy(asc(tagsTable.name))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    throw error;
  }
};
