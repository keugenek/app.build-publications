import { db } from '../db';
import { foldersTable, usersTable } from '../db/schema';
import { type CreateFolderInput, type Folder } from '../schema';
import { eq } from 'drizzle-orm';

export const createFolder = async (input: CreateFolderInput): Promise<Folder> => {
  try {
    // Validate that the user exists first to prevent foreign key constraint violations
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .limit(1)
      .execute();

    if (userExists.length === 0) {
      throw new Error('User not found');
    }

    // Insert folder record
    const result = await db.insert(foldersTable)
      .values({
        user_id: input.user_id,
        name: input.name
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Folder creation failed:', error);
    throw error;
  }
};
