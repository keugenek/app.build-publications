import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const deleteCategory = async (categoryId: number, userId: number): Promise<void> => {
  try {
    // Delete category - this will automatically set category_id to null in notes
    // due to the foreign key constraint with "on delete set null"
    const result = await db.delete(categoriesTable)
      .where(and(
        eq(categoriesTable.id, categoryId),
        eq(categoriesTable.user_id, userId)
      ))
      .execute();

    // Check if category was actually deleted (existed and belonged to user)
    if (result.rowCount === 0) {
      throw new Error('Category not found or access denied');
    }
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
};
