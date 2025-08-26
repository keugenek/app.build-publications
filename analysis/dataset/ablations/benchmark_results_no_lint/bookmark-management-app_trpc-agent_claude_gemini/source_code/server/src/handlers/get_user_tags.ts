import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type Tag } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getUserTags = async (userId: number): Promise<Tag[]> => {
  try {
    const results = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.user_id, userId))
      .orderBy(asc(tagsTable.name))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get user tags:', error);
    throw error;
  }
};
