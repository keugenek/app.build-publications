import { db } from '../db';
import { notesTable } from '../db/schema';
import { type GetUserNotesInput, type Note } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getUserNotes(input: GetUserNotesInput): Promise<Note[]> {
  try {
    const results = await db.select()
      .from(notesTable)
      .where(eq(notesTable.user_id, input.user_id))
      .orderBy(desc(notesTable.updated_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get user notes:', error);
    throw error;
  }
}
