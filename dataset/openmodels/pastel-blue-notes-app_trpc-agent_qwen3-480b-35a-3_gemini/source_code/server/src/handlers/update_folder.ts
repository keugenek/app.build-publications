import { db } from '../db';
import { foldersTable } from '../db/schema';
import { type UpdateFolderInput, type Folder } from '../schema';
import { eq } from 'drizzle-orm';

export const updateFolder = async (input: UpdateFolderInput): Promise<Folder> => {
  try {
    // Build the update data object dynamically based on provided fields
    const updateData: any = {
      updated_at: new Date()
    };
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.parent_id !== undefined) {
      updateData.parent_id = input.parent_id;
    }

    // Update folder record
    const result = await db.update(foldersTable)
      .set(updateData)
      .where(eq(foldersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Folder with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Folder update failed:', error);
    throw error;
  }
};
