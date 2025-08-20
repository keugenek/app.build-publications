import { db } from '../db';
import { foldersTable } from '../db/schema';
import { type UpdateFolderInput, type Folder } from '../schema';
import { eq } from 'drizzle-orm';

export const updateFolder = async (input: UpdateFolderInput): Promise<Folder> => {
  try {
    // First, check if the folder exists and get current data
    const existingFolders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, input.id))
      .execute();

    if (existingFolders.length === 0) {
      throw new Error(`Folder with id ${input.id} not found`);
    }

    const existingFolder = existingFolders[0];

    // Build update object - only include fields that are provided
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    // Update the folder
    const result = await db.update(foldersTable)
      .set(updateData)
      .where(eq(foldersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Failed to update folder');
    }

    return result[0];
  } catch (error) {
    console.error('Folder update failed:', error);
    throw error;
  }
};
