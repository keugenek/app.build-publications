import { db } from '../db';
import { notesTable } from '../db/schema';
import { type CreateNoteInput, type Note } from '../schema';

export const createNote = async (input: CreateNoteInput): Promise<Note> => {
  try {
    // Insert note record
    const result = await db.insert(notesTable)
      .values({
        user_id: input.user_id,
        folder_id: input.folder_id,
        title: input.title,
        content: input.content,
        is_pinned: input.is_pinned || false
      })
      .returning()
      .execute();

    const note = result[0];
    return {
      ...note,
      folder_id: note.folder_id // folder_id is already nullable in the database schema
    };
  } catch (error) {
    console.error('Note creation failed:', error);
    throw error;
  }
};
