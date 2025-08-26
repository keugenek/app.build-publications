import { db } from '../db';
import { notesTable } from '../db/schema';
import { type CreateNoteInput, type Note } from '../schema';

export const createNote = async (input: CreateNoteInput): Promise<Note> => {
  try {
    // Insert note record
    const result = await db.insert(notesTable)
      .values({
        title: input.title,
        content: input.content,
        user_id: input.user_id,
        folder_id: input.folder_id || null
      })
      .returning()
      .execute();

    const note = result[0];
    return {
      ...note,
      created_at: new Date(note.created_at),
      updated_at: new Date(note.updated_at)
    };
  } catch (error) {
    console.error('Note creation failed:', error);
    throw error;
  }
};
