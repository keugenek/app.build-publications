import { db } from '../db';
import { categoriesTable, notesTable } from '../db/schema';
import { type DeleteCategoryInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function deleteCategory(input: DeleteCategoryInput): Promise<boolean> {
  try {
    // First, verify that the category exists and belongs to the user
    const category = await db.select()
      .from(categoriesTable)
      .where(
        and(
          eq(categoriesTable.id, input.id),
          eq(categoriesTable.user_id, input.user_id)
        )
      )
      .execute();

    // If category doesn't exist or doesn't belong to user, return false
    if (category.length === 0) {
      return false;
    }

    // Move all notes in this category to uncategorized (set category_id to null)
    await db.update(notesTable)
      .set({ 
        category_id: null,
        updated_at: new Date()
      })
      .where(eq(notesTable.category_id, input.id))
      .execute();

    // Delete the category
    const deleteResult = await db.delete(categoriesTable)
      .where(
        and(
          eq(categoriesTable.id, input.id),
          eq(categoriesTable.user_id, input.user_id)
        )
      )
      .returning()
      .execute();

    // Return true if a category was actually deleted
    return deleteResult.length > 0;
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
}
