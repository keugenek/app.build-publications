import { db } from '../db';
import { notesTable } from '../db/schema';
import { type GetNotesByUserInput, type Note } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getNotesByUser(input: GetNotesByUserInput): Promise<Note[]> {
  try {
    // Query notes for the specified user, ordered by most recent first
    const results = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, input.user_id))
      .orderBy(desc(notesTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch notes by user:', error);
    throw error;
  }
}
