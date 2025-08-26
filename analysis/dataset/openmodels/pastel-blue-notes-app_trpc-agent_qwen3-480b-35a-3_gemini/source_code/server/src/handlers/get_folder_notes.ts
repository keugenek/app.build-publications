import { db } from '../db';
import { notesTable } from '../db/schema';
import { type Note } from '../schema';
import { eq } from 'drizzle-orm';

export const getFolderNotes = async (folderId: number): Promise<Note[]> => {
  try {
    // Query notes that belong to the specified folder
    const results = await db.select()
      .from(notesTable)
      .where(eq(notesTable.folder_id, folderId))
      .execute();

    // Map results to match the Note schema type
    return results.map(note => ({
      id: note.id,
      title: note.title,
      content: note.content,
      user_id: note.user_id,
      folder_id: note.folder_id ?? null, // Ensure null is properly handled
      created_at: note.created_at,
      updated_at: note.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch notes for folder:', error);
    throw error;
  }
};
