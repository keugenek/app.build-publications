import { db } from '../db';
import { foldersTable } from '../db/schema';
import { type Folder } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserFolders = async (userId: number): Promise<Folder[]> => {
  try {
    // Query folders for the specified user
    const result = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.user_id, userId))
      .execute();

    // Return the folders
    return result;
  } catch (error) {
    console.error('Failed to fetch user folders:', error);
    throw error;
  }
};
