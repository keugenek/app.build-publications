import { db } from '../db';
import { notesTable } from '../db/schema';
import { type UpdateNoteInput, type Note } from '../schema';
import { eq } from 'drizzle-orm';

export const updateNote = async (input: UpdateNoteInput): Promise<Note> => {
  try {
    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };

    // Only add fields to update if they are provided
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.content !== undefined) {
      updateData.content = input.content;
    }
    if (input.folder_id !== undefined) {
      updateData.folder_id = input.folder_id;
    }

    // Update note record
    const result = await db.update(notesTable)
      .set(updateData)
      .where(eq(notesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Note with id ${input.id} not found`);
    }

    // Return the updated note
    const note = result[0];
    return {
      ...note,
      updated_at: note.updated_at || new Date() // Ensure updated_at is set
    };
  } catch (error) {
    console.error('Note update failed:', error);
    throw error;
  }
};
