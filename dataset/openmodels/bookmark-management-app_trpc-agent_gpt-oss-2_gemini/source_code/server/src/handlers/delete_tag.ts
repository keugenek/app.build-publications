import { db } from '../db';
import { tags } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Tag } from '../schema';

/** Delete a tag by its ID and return the deleted tag.
 * Throws an error if the tag does not exist.
 */
export const deleteTag = async (id: number): Promise<Tag> => {
  try {
    const result = await db
      .delete(tags)
      .where(eq(tags.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Tag with id ${id} not found`);
    }

    // Drizzle returns the raw row; it matches our Tag shape
    return result[0];
  } catch (error) {
    console.error('Failed to delete tag:', error);
    throw error;
  }
};
