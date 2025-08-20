import { db } from '../db';
import { notesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Note } from '../schema';

export const getFolderNotes = async (folderId: number): Promise<Note[]> => {
  try {
    // Query notes for the specified folder
    const results = await db.select()
      .from(notesTable)
      .where(eq(notesTable.folder_id, folderId))
      .execute();

    // Convert results to the expected Note type
    return results.map(note => ({
      ...note,
      folder_id: note.folder_id ?? null, // Handle null case properly
      is_pinned: note.is_pinned,
      created_at: note.created_at,
      updated_at: note.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch folder notes:', error);
    throw error;
  }
};
