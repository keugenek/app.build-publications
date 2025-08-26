import { db } from '../db';
import { notesTable } from '../db/schema';
import { type Note } from '../schema';
import { eq, isNull, and } from 'drizzle-orm';

export const getUserNotes = async (userId: number): Promise<Note[]> => {
  try {
    // Fetch all notes for the specified user where folder_id is null (not in folders)
    const results = await db.select()
      .from(notesTable)
      .where(and(
        eq(notesTable.user_id, userId),
        isNull(notesTable.folder_id)
      ))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(note => ({
      ...note,
      id: note.id,
      user_id: note.user_id,
      folder_id: note.folder_id,
      created_at: note.created_at,
      updated_at: note.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch user notes:', error);
    throw error;
  }
};
