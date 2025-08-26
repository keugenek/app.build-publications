import { db } from '../db';
import { notesTable } from '../db/schema';
import { type DeleteNoteInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function deleteNote(input: DeleteNoteInput): Promise<{ success: boolean }> {
  try {
    // Validate that the note exists and belongs to the user
    const existingNote = await db.select()
      .from(notesTable)
      .where(
        and(
          eq(notesTable.id, input.id),
          eq(notesTable.user_id, input.user_id)
        )
      )
      .limit(1)
      .execute();

    if (existingNote.length === 0) {
      throw new Error('Note not found or you do not have permission to delete it');
    }

    // Delete the note
    await db.delete(notesTable)
      .where(
        and(
          eq(notesTable.id, input.id),
          eq(notesTable.user_id, input.user_id)
        )
      )
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Note deletion failed:', error);
    throw error;
  }
}
