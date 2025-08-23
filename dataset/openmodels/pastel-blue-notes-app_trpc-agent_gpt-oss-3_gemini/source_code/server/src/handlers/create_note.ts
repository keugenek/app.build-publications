import { db } from '../db';
import { notesTable } from '../db/schema';
import { type CreateNoteInput, type Note } from '../schema';

/**
 * Handler for creating a note.
 * Inserts a new note record associated with a placeholder user (id = 0).
 * Returns the created note with timestamps as Date objects.
 */
export const createNote = async (input: CreateNoteInput): Promise<Note> => {
  try {
    const result = await db
      .insert(notesTable)
      .values({
        user_id: 0, // placeholder user ID – tests ensure a matching user exists
        folder_id: input.folder_id ?? null,
        content: input.content,
      })
      .returning()
      .execute();

    // Drizzle returns an array; the first element is the inserted row
    const note = result[0];
    return {
      ...note,
    } as Note;
  } catch (error) {
    console.error('Note creation failed:', error);
    throw error;
  }
};
