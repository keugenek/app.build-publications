import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type UpdateTagInput, type Tag } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTag = async (input: UpdateTagInput): Promise<Tag> => {
  try {
    // Build update object only with provided fields
    const updateData: { name?: string; color?: string | null } = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.color !== undefined) {
      updateData.color = input.color;
    }
    
    // Update the tag record
    const result = await db.update(tagsTable)
      .set(updateData)
      .where(eq(tagsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Tag with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Tag update failed:', error);
    throw error;
  }
};
