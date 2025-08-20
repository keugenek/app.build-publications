import { db } from '../db';
import { notesTable } from '../db/schema';
import { type DeleteNoteInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const deleteNote = async (input: DeleteNoteInput): Promise<{ success: boolean }> => {
  try {
    // Delete the note, ensuring it belongs to the user
    const result = await db.delete(notesTable)
      .where(
        and(
          eq(notesTable.id, input.id),
          eq(notesTable.user_id, input.user_id)
        )
      )
      .returning()
      .execute();

    // Check if any rows were deleted
    if (result.length === 0) {
      throw new Error('Note not found or does not belong to user');
    }

    return { success: true };
  } catch (error) {
    console.error('Note deletion failed:', error);
    throw error;
  }
};
