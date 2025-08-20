import { db } from '../db';
import { notesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteNote = async (noteId: number): Promise<void> => {
  try {
    await db.delete(notesTable)
      .where(eq(notesTable.id, noteId))
      .execute();
  } catch (error) {
    console.error('Note deletion failed:', error);
    throw error;
  }
};
