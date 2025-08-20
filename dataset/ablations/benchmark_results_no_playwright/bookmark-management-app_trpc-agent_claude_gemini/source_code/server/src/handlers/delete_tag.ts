import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTag = async (input: DeleteEntityInput): Promise<{ success: boolean }> => {
  try {
    // Delete the tag - the foreign key constraint with CASCADE will automatically 
    // remove all bookmark_tags entries associated with this tag
    const result = await db.delete(tagsTable)
      .where(eq(tagsTable.id, input.id))
      .returning()
      .execute();

    // Return success based on whether a record was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Tag deletion failed:', error);
    throw error;
  }
};
