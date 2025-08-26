import { db } from '../db';
import { notesTable, foldersTable } from '../db/schema';
import { type GetNotesByFolderInput, type Note } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function getNotesByFolder(input: GetNotesByFolderInput): Promise<Note[]> {
  try {
    // If folder_id is provided, validate that the user owns the folder
    if (input.folder_id !== null) {
      const folder = await db.select()
        .from(foldersTable)
        .where(
          and(
            eq(foldersTable.id, input.folder_id),
            eq(foldersTable.user_id, input.user_id)
          )
        )
        .execute();

      // If folder doesn't exist or doesn't belong to user, return empty array
      if (folder.length === 0) {
        return [];
      }
    }

    // Build query conditions
    const baseCondition = eq(notesTable.user_id, input.user_id);
    
    let whereCondition;
    if (input.folder_id === null) {
      // Get uncategorized notes (folder_id is null)
      whereCondition = and(
        baseCondition,
        isNull(notesTable.folder_id)
      );
    } else {
      // Get notes in specific folder
      whereCondition = and(
        baseCondition,
        eq(notesTable.folder_id, input.folder_id)
      );
    }

    const results = await db.select()
      .from(notesTable)
      .where(whereCondition)
      .orderBy(notesTable.created_at)
      .execute();

    return results;
  } catch (error) {
    console.error('Get notes by folder failed:', error);
    throw error;
  }
}
