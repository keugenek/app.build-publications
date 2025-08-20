import { db } from '../db';
import { notesTable } from '../db/schema';
import { type UpdateNoteInput, type Note } from '../schema';
import { eq } from 'drizzle-orm';

export const updateNote = async (input: UpdateNoteInput): Promise<Note> => {
  try {
    // Build the update data object with only the fields that are provided
    const updateData: any = {};
    
    if (input.folder_id !== undefined) {
      updateData.folder_id = input.folder_id;
    }
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.content !== undefined) {
      updateData.content = input.content;
    }
    
    if (input.is_pinned !== undefined) {
      updateData.is_pinned = input.is_pinned;
    }
    
    // Update the note record
    const result = await db.update(notesTable)
      .set(updateData)
      .where(eq(notesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Note with id ${input.id} not found`);
    }

    // Return the updated note
    return result[0];
  } catch (error) {
    console.error('Note update failed:', error);
    throw error;
  }
};
