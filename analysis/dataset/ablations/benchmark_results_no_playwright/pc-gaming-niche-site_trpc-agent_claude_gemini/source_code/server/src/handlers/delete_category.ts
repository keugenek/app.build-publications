import { db } from '../db';
import { categoriesTable, reviewArticlesTable } from '../db/schema';
import { type DeleteCategoryInput } from '../schema';
import { eq, count } from 'drizzle-orm';

export async function deleteCategory(input: DeleteCategoryInput): Promise<{ success: boolean }> {
  try {
    // Check if the category exists
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .execute();

    if (existingCategory.length === 0) {
      throw new Error(`Category with ID ${input.id} not found`);
    }

    // Check if there are review articles referencing this category
    const reviewCount = await db.select({ count: count() })
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.category_id, input.id))
      .execute();

    if (reviewCount[0].count > 0) {
      throw new Error(`Cannot delete category with ID ${input.id} because it has associated review articles`);
    }

    // Delete the category
    await db.delete(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
}
