import { db } from '../db';
import { notesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteByIdInput, type Note } from '../schema';

/**
 * Delete a note by its ID.
 * Returns the deleted note data.
 */
export const deleteNote = async (input: DeleteByIdInput): Promise<Note> => {
  try {
    // Fetch the note first so we can return its data after deletion
    const notes = await db
      .select()
      .from(notesTable)
      .where(eq(notesTable.id, input.id))
      .limit(1)
      .execute();

    const note = notes[0];
    if (!note) {
      throw new Error(`Note with id ${input.id} not found`);
    }

    // Delete the note
    await db.delete(notesTable).where(eq(notesTable.id, input.id)).execute();

    // Return the note data (drizzle already returns proper Date objects)
    return note as Note;
  } catch (error) {
    console.error('Failed to delete note:', error);
    throw error;
  }
};
