import { db } from '../db';
import { notesTable, categoriesTable } from '../db/schema';
import { type UpdateNoteInput, type Note } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateNote = async (input: UpdateNoteInput): Promise<Note> => {
  try {
    // 1. Validate user owns the note
    const existingNote = await db.select()
      .from(notesTable)
      .where(and(
        eq(notesTable.id, input.id),
        eq(notesTable.user_id, input.user_id)
      ))
      .execute();

    if (existingNote.length === 0) {
      throw new Error('Note not found or access denied');
    }

    // 2. If category_id is being updated, validate user owns that category
    if (input.category_id !== undefined && input.category_id !== null) {
      const category = await db.select()
        .from(categoriesTable)
        .where(and(
          eq(categoriesTable.id, input.category_id),
          eq(categoriesTable.user_id, input.user_id)
        ))
        .execute();

      if (category.length === 0) {
        throw new Error('Category not found or access denied');
      }
    }

    // 3. Build update object with only provided fields
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

    // 4. Update the note in database
    const result = await db.update(notesTable)
      .set(updateData)
      .where(eq(notesTable.id, input.id))
      .returning()
      .execute();

    // 5. Return the updated note
    return result[0];
  } catch (error) {
    console.error('Note update failed:', error);
    throw error;
  }
};
