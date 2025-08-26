import { db } from '../db';
import { categoriesTable, notesTable } from '../db/schema';
import { type DeleteCategoryInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function deleteCategory(input: DeleteCategoryInput): Promise<{ success: boolean }> {
  try {
    // Verify the category exists and belongs to the user
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(
        and(
          eq(categoriesTable.id, input.id),
          eq(categoriesTable.user_id, input.user_id)
        )
      )
      .execute();

    if (existingCategory.length === 0) {
      throw new Error('Category not found or does not belong to user');
    }

    // Handle notes that belong to this category (set category_id to null)
    await db.update(notesTable)
      .set({ category_id: null })
      .where(eq(notesTable.category_id, input.id))
      .execute();

    // Delete the category from the database
    await db.delete(categoriesTable)
      .where(
        and(
          eq(categoriesTable.id, input.id),
          eq(categoriesTable.user_id, input.user_id)
        )
      )
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
}
