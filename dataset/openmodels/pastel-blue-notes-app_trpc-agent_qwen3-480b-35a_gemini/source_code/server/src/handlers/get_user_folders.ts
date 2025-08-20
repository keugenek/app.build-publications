import { db } from '../db';
import { foldersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Folder } from '../schema';

export const getUserFolders = async (userId: number): Promise<Folder[]> => {
  try {
    const results = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.user_id, userId))
      .execute();

    return results.map(folder => ({
      id: folder.id,
      user_id: folder.user_id,
      name: folder.name,
      color: folder.color,
      created_at: folder.created_at,
      updated_at: folder.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch user folders:', error);
    throw error;
  }
};
