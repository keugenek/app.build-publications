import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput, type Category } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateCategory = async (input: UpdateCategoryInput, userId: number): Promise<Category> => {
  try {
    // Update category record where id matches and user_id matches
    const result = await db.update(categoriesTable)
      .set({
        name: input.name,
        updated_at: new Date()
      })
      .where(and(
        eq(categoriesTable.id, input.id),
        eq(categoriesTable.user_id, userId)
      ))
      .returning()
      .execute();

    // Check if a category was actually updated
    if (result.length === 0) {
      throw new Error('Category not found or does not belong to user');
    }

    // Return the updated category
    return result[0];
  } catch (error) {
    console.error('Category update failed:', error);
    throw error;
  }
};
