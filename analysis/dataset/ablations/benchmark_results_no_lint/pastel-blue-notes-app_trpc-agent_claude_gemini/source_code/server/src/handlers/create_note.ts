import { db } from '../db';
import { notesTable, usersTable, categoriesTable } from '../db/schema';
import { type CreateNoteInput, type Note } from '../schema';
import { eq } from 'drizzle-orm';

export const createNote = async (input: CreateNoteInput): Promise<Note> => {
  try {
    // 1. Validate that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // 2. If category_id is provided, verify it belongs to the user
    if (input.category_id !== null && input.category_id !== undefined) {
      const category = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();

      if (category.length === 0) {
        throw new Error('Category not found');
      }

      if (category[0].user_id !== input.user_id) {
        throw new Error('Category does not belong to user');
      }
    }

    // 3. Create a new note record in the database
    const result = await db.insert(notesTable)
      .values({
        title: input.title,
        content: input.content,
        user_id: input.user_id,
        category_id: input.category_id || null
      })
      .returning()
      .execute();

    // 4. Return the created note data
    return result[0];
  } catch (error) {
    console.error('Note creation failed:', error);
    throw error;
  }
};
