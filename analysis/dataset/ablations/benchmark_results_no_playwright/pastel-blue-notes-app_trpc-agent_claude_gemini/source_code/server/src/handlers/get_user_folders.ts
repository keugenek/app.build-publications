import { db } from '../db';
import { foldersTable } from '../db/schema';
import { type GetUserFoldersInput, type Folder } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getUserFolders(input: GetUserFoldersInput): Promise<Folder[]> {
  try {
    // Query folders for the specified user, ordered by creation date (newest first)
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.user_id, input.user_id))
      .orderBy(desc(foldersTable.created_at))
      .execute();

    return folders;
  } catch (error) {
    console.error('Get user folders failed:', error);
    throw error;
  }
}
