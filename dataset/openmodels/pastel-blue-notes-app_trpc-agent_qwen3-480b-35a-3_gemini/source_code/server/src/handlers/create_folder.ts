import { db } from '../db';
import { foldersTable } from '../db/schema';
import { type CreateFolderInput, type Folder } from '../schema';

export const createFolder = async (input: CreateFolderInput): Promise<Folder> => {
  try {
    // Insert folder record
    const result = await db.insert(foldersTable)
      .values({
        name: input.name,
        user_id: input.user_id,
        parent_id: input.parent_id ?? null
      })
      .returning()
      .execute();

    const folder = result[0];
    return {
      ...folder,
      parent_id: folder.parent_id
    };
  } catch (error) {
    console.error('Folder creation failed:', error);
    throw error;
  }
};
