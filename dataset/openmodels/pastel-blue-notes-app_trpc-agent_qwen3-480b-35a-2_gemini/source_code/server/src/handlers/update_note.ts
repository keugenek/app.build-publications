import { db } from '../db';
import { notesTable } from '../db/schema';
import { type UpdateNoteInput, type Note } from '../schema';
import { eq } from 'drizzle-orm';
import { noteSchema } from '../schema';

export const updateNote = async (input: UpdateNoteInput, userId: number): Promise<Note> => {
  try {
    // Build the update data object with only the fields that are provided
    const updateData: Partial<typeof notesTable.$inferInsert> = {
      updated_at: new Date(),
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
      .where(eq(notesTable.id, input.id))
      .returning()
      .execute();

    // Check if note was found and updated
    if (result.length === 0) {
      throw new Error('Note not found');
    }

    // Verify that the note belongs to the user
    const note = result[0];
    if (note.user_id !== userId) {
      throw new Error('Unauthorized: Note does not belong to user');
    }

    // Validate and return the result
    return noteSchema.parse(note);
  } catch (error) {
    console.error('Note update failed:', error);
    throw error;
  }
};
