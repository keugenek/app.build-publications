import { db } from '../db';
import { notesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const deleteNote = async (id: number, userId: number): Promise<void> => {
  try {
    // Delete note only if it belongs to the user
    const result = await db.delete(notesTable)
      .where(and(
        eq(notesTable.id, id),
        eq(notesTable.user_id, userId)
      ))
      .execute();

    // Check if any rows were affected
    if (result.rowCount === 0) {
      throw new Error('Note not found or unauthorized');
    }
  } catch (error) {
    console.error('Note deletion failed:', error);
    throw error;
  }
};
