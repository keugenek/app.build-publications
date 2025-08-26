import { db } from '../db';
import { eq } from 'drizzle-orm';
import { foldersTable } from '../db/schema';
import { type UpdateFolderInput, type Folder } from '../schema';

/**
 * Update a folder's properties.
 *
 * - If a new name is provided, the folder's name is updated.
 * - If the name is omitted, the existing name is retained.
 * - Returns the updated folder record with proper types.
 */
export const updateFolder = async (input: UpdateFolderInput): Promise<Folder> => {
  try {
    // Fetch the existing folder to preserve fields that are not being updated.
    const existingResult = await db
      .select()
      .from(foldersTable)
      .where(eq(foldersTable.id, input.id))
      .execute();

    if (existingResult.length === 0) {
      throw new Error('Folder not found');
    }

    const existing = existingResult[0];
    const newName = input.name ?? existing.name;

    // Perform the update and return the updated row.
    const updatedResult = await db
      .update(foldersTable)
      .set({ name: newName })
      .where(eq(foldersTable.id, input.id))
      .returning()
      .execute();

    const updated = updatedResult[0];
    return {
      id: updated.id,
      name: updated.name,
      user_id: updated.user_id,
      created_at: updated.created_at,
    } as Folder;
  } catch (error) {
    console.error('Failed to update folder:', error);
    throw error;
  }
};
