import { db } from '../db';
import { notesTable } from '../db/schema';
import { type Note } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserNotes = async (userId: number): Promise<Note[]> => {
  try {
    // Query notes for the specified user
    const results = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, userId))
      .execute();

    // Return the notes
    return results.map(note => ({
      ...note,
      is_pinned: note.is_pinned
    }));
  } catch (error) {
    console.error('Failed to fetch user notes:', error);
    throw error;
  }
};
