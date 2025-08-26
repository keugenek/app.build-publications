import { db } from '../db';
import { notesTable } from '../db/schema';
import { type CreateNoteInput, type Note } from '../schema';

export const createNote = async (input: CreateNoteInput, userId: number): Promise<Note> => {
  try {
    // Insert note record
    const result = await db.insert(notesTable)
      .values({
        title: input.title,
        content: input.content,
        user_id: userId,
        category_id: input.category_id ?? null
      })
      .returning()
      .execute();

    const note = result[0];
    return {
      ...note,
      created_at: note.created_at,
      updated_at: note.updated_at
    };
  } catch (error) {
    console.error('Note creation failed:', error);
    throw error;
  }
};
