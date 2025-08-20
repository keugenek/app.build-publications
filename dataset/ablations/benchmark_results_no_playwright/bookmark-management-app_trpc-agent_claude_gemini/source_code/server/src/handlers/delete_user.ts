import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteEntityInput } from '../schema';

export const deleteUser = async (input: DeleteEntityInput): Promise<{ success: boolean }> => {
  try {
    // Delete user - cascading deletes will handle all associated data
    // (collections, tags, bookmarks, bookmark_tags as defined in schema)
    const result = await db.delete(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    // Check if any rows were affected (user existed)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
};
