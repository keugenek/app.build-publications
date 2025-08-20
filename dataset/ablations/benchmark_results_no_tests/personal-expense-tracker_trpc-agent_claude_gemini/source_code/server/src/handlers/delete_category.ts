import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteCategory = async (id: number): Promise<{ success: boolean }> => {
  try {
    // First, check if the category exists
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .execute();

    if (existingCategory.length === 0) {
      throw new Error(`Category with id ${id} not found`);
    }

    // Delete the category - cascading deletes will handle related transactions and budgets
    const result = await db.delete(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
};
