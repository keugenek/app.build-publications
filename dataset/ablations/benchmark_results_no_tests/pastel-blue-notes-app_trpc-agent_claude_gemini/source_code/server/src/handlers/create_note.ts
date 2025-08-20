import { db } from '../db';
import { notesTable, usersTable, categoriesTable } from '../db/schema';
import { type CreateNoteInput, type Note } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function createNote(input: CreateNoteInput): Promise<Note> {
  try {
    // First validate that the user exists
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    // If category_id is provided, validate that the category exists and belongs to the user
    if (input.category_id !== undefined && input.category_id !== null) {
      const categories = await db.select()
        .from(categoriesTable)
        .where(
          and(
            eq(categoriesTable.id, input.category_id),
            eq(categoriesTable.user_id, input.user_id)
          )
        )
        .execute();

      if (categories.length === 0) {
        throw new Error('Category not found or does not belong to user');
      }
    }

    // Insert the note
    const result = await db.insert(notesTable)
      .values({
        title: input.title,
        content: input.content,
        user_id: input.user_id,
        category_id: input.category_id || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Note creation failed:', error);
    throw error;
  }
}
