import { db } from '../db';
import { notesTable, categoriesTable } from '../db/schema';
import { type UpdateNoteInput, type Note } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateNote = async (input: UpdateNoteInput): Promise<Note> => {
  try {
    // First, verify the note exists and belongs to the user
    const existingNote = await db.select()
      .from(notesTable)
      .where(and(
        eq(notesTable.id, input.id),
        eq(notesTable.user_id, input.user_id)
      ))
      .execute();

    if (existingNote.length === 0) {
      throw new Error('Note not found or you do not have permission to update it');
    }

    // If category_id is being changed, verify the new category belongs to user
    if (input.category_id !== undefined && input.category_id !== null) {
      const categoryExists = await db.select()
        .from(categoriesTable)
        .where(and(
          eq(categoriesTable.id, input.category_id),
          eq(categoriesTable.user_id, input.user_id)
        ))
        .execute();

      if (categoryExists.length === 0) {
        throw new Error('Category not found or you do not have permission to use it');
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    if (input.category_id !== undefined) {
      updateData.category_id = input.category_id;
    }

    // Update the note
    const result = await db.update(notesTable)
      .set(updateData)
      .where(and(
        eq(notesTable.id, input.id),
        eq(notesTable.user_id, input.user_id)
      ))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Note update failed:', error);
    throw error;
  }
};
