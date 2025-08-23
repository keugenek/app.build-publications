import { db } from '../db';
import { notesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateNoteInput, type Note } from '../schema';

/**
 * Updates an existing note in the database.
 * Fields that are undefined in the input are left unchanged.
 * Returns the updated note with proper Date objects.
 */
export const updateNote = async (input: UpdateNoteInput): Promise<Note> => {
  try {
    // Build the fields to update; only include properties that are defined
    const updateFields: Partial<{
      title: string;
      content: string;
      folder_id: number | null;
      updated_at: Date;
    }> = {};

    if (input.title !== undefined) updateFields.title = input.title;
    if (input.content !== undefined) updateFields.content = input.content;
    if (input.folder_id !== undefined) updateFields.folder_id = input.folder_id;
    // Always update the updated_at timestamp
    updateFields.updated_at = new Date();

    const result = await db
      .update(notesTable)
      .set(updateFields)
      .where(eq(notesTable.id, input.id))
      .returning()
      .execute();

    const updated = result[0];
    if (!updated) {
      throw new Error(`Note with id ${input.id} not found`);
    }

    // Return the note matching the Zod schema
    return {
      id: updated.id,
      title: updated.title,
      content: updated.content,
      folder_id: updated.folder_id ?? null,
      user_id: updated.user_id,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    } as Note;
  } catch (error) {
    console.error('Failed to update note:', error);
    throw error;
  }
};
