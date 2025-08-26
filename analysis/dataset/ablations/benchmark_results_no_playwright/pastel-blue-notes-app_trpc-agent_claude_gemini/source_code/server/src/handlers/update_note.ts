import { db } from '../db';
import { notesTable } from '../db/schema';
import { type UpdateNoteInput, type Note } from '../schema';
import { eq } from 'drizzle-orm';

export const updateNote = async (input: UpdateNoteInput): Promise<Note> => {
  try {
    // First, get the current note to verify ownership and get existing data
    const existingNotes = await db.select()
      .from(notesTable)
      .where(eq(notesTable.id, input.id))
      .execute();

    if (existingNotes.length === 0) {
      throw new Error(`Note with id ${input.id} not found`);
    }

    const existingNote = existingNotes[0];

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    if (input.folder_id !== undefined) {
      updateData.folder_id = input.folder_id;
    }

    // Update the note
    const result = await db.update(notesTable)
      .set(updateData)
      .where(eq(notesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Note update failed:', error);
    throw error;
  }
};
