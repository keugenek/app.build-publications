import { db } from '../db';
import { eq } from 'drizzle-orm';
import { categoriesTable } from '../db/schema';
import { type Category } from '../schema';

/**
 * Deletes a category by its ID and returns the deleted record.
 * Throws an error if the category does not exist.
 */
export const deleteCategory = async (id: number): Promise<Category> => {
  try {
    const result = await db
      .delete(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Category not found');
    }

    // Drizzle returns the row with the correct types, but ensure date is a Date object
    const deleted = result[0];
    return {
      ...deleted,
      created_at: new Date(deleted.created_at),
    } as Category;
  } catch (error) {
    console.error('Failed to delete category:', error);
    throw error;
  }
};
