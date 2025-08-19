import { db } from '../db';
import { notesTable, categoriesTable, usersTable } from '../db/schema';
import { type CreateNoteInput, type Note } from '../schema';
import { eq } from 'drizzle-orm';

export const createNote = async (input: CreateNoteInput): Promise<Note> => {
  try {
    // 1. Validate user exists
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error('User not found');
    }

    // 2. If category_id provided, validate user owns that category
    if (input.category_id) {
      const categoryExists = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();

      if (categoryExists.length === 0) {
        throw new Error('Category not found');
      }

      if (categoryExists[0].user_id !== input.user_id) {
        throw new Error('Category does not belong to user');
      }
    }

    // 3. Insert new note into database
    const result = await db.insert(notesTable)
      .values({
        title: input.title,
        content: input.content,
        category_id: input.category_id || null,
        user_id: input.user_id
      })
      .returning()
      .execute();

    // 4. Return the created note
    return result[0];
  } catch (error) {
    console.error('Note creation failed:', error);
    throw error;
  }
};
