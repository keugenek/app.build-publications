import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type CreateTagInput, type Tag } from '../schema';

/** Handler for creating a tag */
export const createTag = async (input: CreateTagInput): Promise<Tag> => {
  try {
    const result = await db
      .insert(tagsTable)
      .values({
        user_id: input.user_id,
        name: input.name,
      })
      .returning()
      .execute();

    // result is an array with a single inserted row
    const tag = result[0];
    return tag;
  } catch (error) {
    console.error('Tag creation failed:', error);
    throw error;
  }
};
