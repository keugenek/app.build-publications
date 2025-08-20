import { db } from '../db';
import { notesTable, categoriesTable } from '../db/schema';
import { type GetNotesByCategoryInput, type Note } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function getNotesByCategory(input: GetNotesByCategoryInput): Promise<Note[]> {
  try {
    // If category_id is provided, validate that the category belongs to the user
    if (input.category_id !== null) {
      const category = await db.select()
        .from(categoriesTable)
        .where(
          and(
            eq(categoriesTable.id, input.category_id),
            eq(categoriesTable.user_id, input.user_id)
          )
        )
        .execute();

      if (category.length === 0) {
        throw new Error('Category not found or does not belong to user');
      }
    }

    // Build query conditions
    const conditions = [eq(notesTable.user_id, input.user_id)];

    if (input.category_id === null) {
      // Get uncategorized notes (category_id is null)
      conditions.push(isNull(notesTable.category_id));
    } else {
      // Get notes for specific category
      conditions.push(eq(notesTable.category_id, input.category_id));
    }

    // Execute query
    const results = await db.select()
      .from(notesTable)
      .where(and(...conditions))
      .execute();

    return results;
  } catch (error) {
    console.error('Get notes by category failed:', error);
    throw error;
  }
}
