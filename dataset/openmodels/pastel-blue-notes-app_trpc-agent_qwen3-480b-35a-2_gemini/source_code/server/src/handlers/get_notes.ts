import { db } from '../db';
import { notesTable } from '../db/schema';
import { type Note } from '../schema';
import { eq } from 'drizzle-orm';

export const getNotes = async (userId: number): Promise<Note[]> => {
  try {
    // Fetch all notes for the specified user
    const results = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, userId))
      .execute();

    // Convert results to match the Note schema
    return results.map(note => ({
      ...note,
      created_at: note.created_at,
      updated_at: note.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    throw error;
  }
};
