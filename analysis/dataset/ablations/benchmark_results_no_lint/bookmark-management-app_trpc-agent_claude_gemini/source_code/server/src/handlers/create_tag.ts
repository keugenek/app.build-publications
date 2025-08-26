import { db } from '../db';
import { tagsTable, usersTable } from '../db/schema';
import { type CreateTagInput, type Tag } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createTag = async (input: CreateTagInput): Promise<Tag> => {
  try {
    // Verify that the user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with ID ${input.user_id} does not exist`);
    }

    // Check if tag name already exists for this user
    const existingTag = await db.select()
      .from(tagsTable)
      .where(
        and(
          eq(tagsTable.user_id, input.user_id),
          eq(tagsTable.name, input.name)
        )
      )
      .execute();

    if (existingTag.length > 0) {
      throw new Error(`Tag with name "${input.name}" already exists for this user`);
    }

    // Insert new tag
    const result = await db.insert(tagsTable)
      .values({
        name: input.name,
        color: input.color,
        user_id: input.user_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Tag creation failed:', error);
    throw error;
  }
};
