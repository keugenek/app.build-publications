import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type GetUserEntityInput, type Tag } from '../schema';
import { eq } from 'drizzle-orm';

export const getTags = async (input: GetUserEntityInput): Promise<Tag[]> => {
  try {
    // Query all tags for the specified user
    const results = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.user_id, input.user_id))
      .execute();

    // Return the results (no numeric conversions needed for tags table)
    return results;
  } catch (error) {
    console.error('Failed to get tags:', error);
    throw error;
  }
};
