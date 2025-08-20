import { db } from '../db';
import { foldersTable } from '../db/schema';
import { type UpdateFolderInput, type Folder } from '../schema';
import { eq } from 'drizzle-orm';

export const updateFolder = async (input: UpdateFolderInput): Promise<Folder> => {
  try {
    // Update folder record
    const result = await db.update(foldersTable)
      .set({
        name: input.name,
        color: input.color,
        updated_at: new Date() // Explicitly set updated_at to current timestamp
      })
      .where(eq(foldersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Folder with id ${input.id} not found`);
    }

    // Return the updated folder
    return result[0];
  } catch (error) {
    console.error('Folder update failed:', error);
    throw error;
  }
};
