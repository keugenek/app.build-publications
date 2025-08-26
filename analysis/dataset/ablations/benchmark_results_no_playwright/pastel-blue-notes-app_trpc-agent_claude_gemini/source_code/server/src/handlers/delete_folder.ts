import { db } from '../db';
import { foldersTable, notesTable } from '../db/schema';
import { type DeleteFolderInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function deleteFolder(input: DeleteFolderInput): Promise<{ success: boolean }> {
  try {
    // First, check if the folder exists and belongs to the user
    const existingFolder = await db.select()
      .from(foldersTable)
      .where(
        and(
          eq(foldersTable.id, input.id),
          eq(foldersTable.user_id, input.user_id)
        )
      )
      .execute();

    if (existingFolder.length === 0) {
      throw new Error('Folder not found or access denied');
    }

    // Delete the folder - notes with this folder_id will automatically have
    // their folder_id set to null due to the "set null" cascade constraint
    await db.delete(foldersTable)
      .where(eq(foldersTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Folder deletion failed:', error);
    throw error;
  }
}
