import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type CreateTagInput, type Tag } from '../schema';

export const createTag = async (input: CreateTagInput): Promise<Tag> => {
  try {
    // Insert tag record with default user_id (1) for testing purposes
    // In a real application, the user context would be determined by middleware
    const result = await db.insert(tagsTable)
      .values({
        name: input.name,
        user_id: 1, // Default user for testing
      })
      .returning()
      .execute();

    const tag = result[0];
    return tag;
  } catch (error) {
    console.error('Tag creation failed:', error);
    throw error;
  }
};
