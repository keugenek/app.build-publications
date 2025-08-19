import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput, type Category } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateCategory = async (input: UpdateCategoryInput): Promise<Category> => {
  try {
    // First verify that the category exists and belongs to the user
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(and(
        eq(categoriesTable.id, input.id),
        eq(categoriesTable.user_id, input.user_id)
      ))
      .execute();

    if (existingCategory.length === 0) {
      throw new Error('Category not found or unauthorized');
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof categoriesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.color !== undefined) {
      updateData.color = input.color;
    }

    // Update the category
    const result = await db.update(categoriesTable)
      .set(updateData)
      .where(and(
        eq(categoriesTable.id, input.id),
        eq(categoriesTable.user_id, input.user_id)
      ))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Failed to update category');
    }

    return result[0];
  } catch (error) {
    console.error('Category update failed:', error);
    throw error;
  }
};
