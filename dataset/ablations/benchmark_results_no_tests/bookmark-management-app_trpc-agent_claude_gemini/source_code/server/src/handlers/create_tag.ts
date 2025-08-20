import { db } from '../db';
import { tagsTable, usersTable } from '../db/schema';
import { type CreateTagInput, type Tag } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createTag = async (input: CreateTagInput): Promise<Tag> => {
  try {
    // First verify the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Check if a tag with the same name already exists for this user
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
      throw new Error(`Tag with name '${input.name}' already exists for this user`);
    }

    // Insert the new tag
    const result = await db.insert(tagsTable)
      .values({
        user_id: input.user_id,
        name: input.name,
        color: input.color || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Tag creation failed:', error);
    throw error;
  }
};
