import { db } from '../db';
import { foldersTable } from '../db/schema';
import { type CreateFolderInput, type Folder } from '../schema';

/** Create a folder in the database */
export const createFolder = async (input: CreateFolderInput): Promise<Folder> => {
  try {
    // Insert folder record
    const result = await db
      .insert(foldersTable)
      .values({
        name: input.name,
        user_id: input.user_id,
      })
      .returning()
      .execute();

    const folder = result[0];
    // The returned folder already contains created_at as Date
    return folder as Folder;
  } catch (error) {
    console.error('Folder creation failed:', error);
    throw error;
  }
};
