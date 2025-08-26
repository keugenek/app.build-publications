import { db } from '../db';
import { foldersTable } from '../db/schema';
import { type CreateFolderInput, type Folder } from '../schema';

export const createFolder = async (input: CreateFolderInput): Promise<Folder> => {
  try {
    const result = await db.insert(foldersTable)
      .values({
        user_id: input.user_id,
        name: input.name,
        color: input.color
      })
      .returning()
      .execute();
    
    return result[0];
  } catch (error) {
    console.error('Folder creation failed:', error);
    throw error;
  }
};
