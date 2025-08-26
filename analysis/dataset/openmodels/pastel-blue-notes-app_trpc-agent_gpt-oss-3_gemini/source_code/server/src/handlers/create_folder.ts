import { db } from '../db';
import { foldersTable, usersTable } from '../db/schema';
import { type CreateFolderInput, type Folder } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Creates a new folder (category) for the first existing user.
 * In a real implementation the user ID would be provided via authentication context.
 */
export const createFolder = async (input: CreateFolderInput): Promise<Folder> => {
  try {
    // Retrieve a user to associate the folder with. For testing we assume at least one user exists.
    const users = await db.select().from(usersTable).limit(1).execute();
    const user = users[0];
    if (!user) {
      throw new Error('No user found to associate folder');
    }

    const result = await db
      .insert(foldersTable)
      .values({
        user_id: user.id,
        name: input.name,
      })
      .returning()
      .execute();

    const folder = result[0];
    return {
      id: folder.id,
      user_id: folder.user_id,
      name: folder.name,
      created_at: folder.created_at,
    } as Folder;
  } catch (error) {
    console.error('Folder creation failed:', error);
    throw error;
  }
};
