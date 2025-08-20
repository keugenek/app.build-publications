import { db } from '../db';
import { notesTable } from '../db/schema';
import { type DeleteNoteInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const deleteNote = async (input: DeleteNoteInput): Promise<boolean> => {
  try {
    // Delete the note that matches both the note ID and user ID
    // This ensures users can only delete their own notes
    const result = await db.delete(notesTable)
      .where(
        and(
          eq(notesTable.id, input.id),
          eq(notesTable.user_id, input.user_id)
        )
      )
      .execute();

    // Check if any rows were affected (note was found and deleted)
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Note deletion failed:', error);
    throw error;
  }
};
