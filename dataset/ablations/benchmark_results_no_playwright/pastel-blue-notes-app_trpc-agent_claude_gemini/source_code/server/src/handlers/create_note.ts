import { db } from '../db';
import { notesTable, foldersTable, usersTable } from '../db/schema';
import { type CreateNoteInput, type Note } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createNote = async (input: CreateNoteInput): Promise<Note> => {
  try {
    // Validate that the user exists
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error('User not found');
    }

    // If folder_id is provided, validate that the user owns the folder
    if (input.folder_id !== null) {
      const folderExists = await db.select()
        .from(foldersTable)
        .where(
          and(
            eq(foldersTable.id, input.folder_id),
            eq(foldersTable.user_id, input.user_id)
          )
        )
        .execute();

      if (folderExists.length === 0) {
        throw new Error('Folder not found or does not belong to user');
      }
    }

    // Insert the note
    const result = await db.insert(notesTable)
      .values({
        user_id: input.user_id,
        folder_id: input.folder_id,
        title: input.title,
        content: input.content
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Note creation failed:', error);
    throw error;
  }
};
