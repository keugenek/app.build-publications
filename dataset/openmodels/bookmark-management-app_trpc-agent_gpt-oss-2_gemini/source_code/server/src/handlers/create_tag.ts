import { type CreateTagInput, type Tag } from '../schema';

import { db } from '../db';
import { tags } from '../db/schema';

/** Creates a new tag in the database. */
export const createTag = async (input: CreateTagInput): Promise<Tag> => {
  try {
    const result = await db
      .insert(tags)
      .values({
        name: input.name,
        // user_id is nullable; not set here so defaults to NULL
      })
      .returning()
      .execute();
    // result is an array with the inserted row
    return result[0] as Tag;
  } catch (error) {
    console.error('Tag creation failed:', error);
    throw error;
  }
};
