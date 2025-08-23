import { db } from '../db';
import { notesTable } from '../db/schema';
import { type CreateNoteInput, type Note } from '../schema';

/**
 * Creates a note in the database and returns the created note.
 * Handles optional folder association and ensures timestamps are returned as Date objects.
 */
export const createNote = async (input: CreateNoteInput): Promise<Note> => {
  try {
    const result = await db
      .insert(notesTable)
      .values({
        title: input.title,
        content: input.content,
        // folder_id is nullable; if undefined treat as null
        folder_id: input.folder_id ?? null,
        user_id: input.user_id,
      })
      .returning()
      .execute();

    // Drizzle returns an array; first element is the inserted row
    const note = result[0];
    return note as Note;
  } catch (error) {
    console.error('Note creation failed:', error);
    throw error;
  }
};
