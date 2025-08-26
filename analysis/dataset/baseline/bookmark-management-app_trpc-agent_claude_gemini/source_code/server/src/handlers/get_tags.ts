import { db } from '../db';
import { tagsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Tag } from '../schema';

export async function getTags(userId: number): Promise<Tag[]> {
  try {
    // Query all tags for the specified user
    const results = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.user_id, userId))
      .execute();

    return results;
  } catch (error) {
    console.error('Get tags failed:', error);
    throw error;
  }
}
