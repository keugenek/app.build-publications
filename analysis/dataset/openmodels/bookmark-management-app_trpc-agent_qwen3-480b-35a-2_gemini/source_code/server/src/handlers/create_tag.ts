import { db } from '../db';
import { tagsTable, usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateTagInput, type Tag } from '../schema';

export const createTag = async (input: CreateTagInput): Promise<Tag> => {
  try {
    // First, verify that the user exists to prevent foreign key constraint errors
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();
    
    if (users.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Insert tag record
    const result = await db.insert(tagsTable)
      .values({
        user_id: input.user_id,
        name: input.name
      })
      .returning()
      .execute();

    const tag = result[0];
    return {
      ...tag,
      created_at: tag.created_at
    };
  } catch (error) {
    console.error('Tag creation failed:', error);
    throw error;
  }
};
