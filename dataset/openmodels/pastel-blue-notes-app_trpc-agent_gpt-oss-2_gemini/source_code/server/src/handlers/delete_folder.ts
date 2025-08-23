import { type DeleteByIdInput, type Folder } from '../schema';

import { db } from '../db';
import { eq } from 'drizzle-orm';
import { tables } from '../db/schema';
/** Delete a folder by its ID and return the deleted folder record */
export const deleteFolder = async (input: DeleteByIdInput): Promise<Folder> => {
  try {
    // Attempt to delete and return the deleted row
    const result = await db
      .delete(tables.folders)
      .where(eq(tables.folders.id, input.id))
      .returning()
      .execute();

    // If no rows were deleted, throw an error
    if (result.length === 0) {
      throw new Error(`Folder with id ${input.id} not found`);
    }

    // Drizzle returns the full row, which matches Folder type
    return result[0];
  } catch (error) {
    console.error('Failed to delete folder:', error);
    throw error;
  }
};
