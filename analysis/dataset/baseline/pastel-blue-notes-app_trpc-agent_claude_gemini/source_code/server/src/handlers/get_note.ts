import { db } from '../db';
import { notesTable } from '../db/schema';
import { type Note } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getNote = async (noteId: number, userId: number): Promise<Note | null> => {
  try {
    // Query database for note by ID and user ID to ensure ownership
    const result = await db.select()
      .from(notesTable)
      .where(and(
        eq(notesTable.id, noteId),
        eq(notesTable.user_id, userId)
      ))
      .limit(1)
      .execute();

    // Return the note if found, null otherwise
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Get note failed:', error);
    throw error;
  }
};
