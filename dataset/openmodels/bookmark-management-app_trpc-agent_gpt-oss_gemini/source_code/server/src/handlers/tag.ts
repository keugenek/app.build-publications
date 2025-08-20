import { type CreateTagInput, type Tag } from '../schema';
import { db } from '../db';
import { tables } from '../db/schema';

/** Placeholder for creating a tag */
export const createTag = async (input: CreateTagInput): Promise<Tag> => {
  try {
    const result = await db
      .insert(tables.tags)
      .values({
        user_id: input.user_id,
        name: input.name,
      })
      .returning()
      .execute();

    // result[0] contains the inserted tag
    const tag = result[0];
    return {
      id: tag.id,
      user_id: tag.user_id,
      name: tag.name,
      created_at: tag.created_at,
    } as Tag;
  } catch (error) {
    console.error('Tag creation failed:', error);
    throw error;
  }
};

/** Fetch all tags */
export const getTags = async (): Promise<Tag[]> => {
  try {
    const results = await db.select().from(tables.tags).execute();
    return results.map(tag => ({
      id: tag.id,
      user_id: tag.user_id,
      name: tag.name,
      created_at: tag.created_at,
    }) as Tag);
  } catch (error) {
    console.error('Fetching tags failed:', error);
    throw error;
  }
};
