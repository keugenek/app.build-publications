import { db } from '../db';
import { notesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const deleteNote = async (noteId: number, userId: number): Promise<void> => {
  try {
    // First, check if the note exists and belongs to the user
    const existingNote = await db.select()
      .from(notesTable)
      .where(and(
        eq(notesTable.id, noteId),
        eq(notesTable.user_id, userId)
      ))
      .limit(1)
      .execute();

    if (existingNote.length === 0) {
      throw new Error('Note not found or access denied');
    }

    // Delete the note
    const result = await db.delete(notesTable)
      .where(and(
        eq(notesTable.id, noteId),
        eq(notesTable.user_id, userId)
      ))
      .execute();

    // Verify the deletion was successful
    if (result.rowCount === 0) {
      throw new Error('Failed to delete note');
    }
  } catch (error) {
    console.error('Note deletion failed:', error);
    throw error;
  }
};
