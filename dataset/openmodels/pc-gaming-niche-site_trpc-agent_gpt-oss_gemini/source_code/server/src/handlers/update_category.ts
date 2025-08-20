import { type UpdateCategoryInput, type Category } from '../schema';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const updateCategory = async (input: UpdateCategoryInput): Promise<Category> => {
  try {
    // If no fields to update, fetch existing category
    if (input.name === undefined) {
      const existing = await db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.id))
        .execute();
      if (existing.length === 0) {
        throw new Error(`Category with id ${input.id} not found`);
      }
      return existing[0] as Category;
    }

    // Perform update and return the updated record
    const updated = await db
      .update(categoriesTable)
      .set({ name: input.name })
      .where(eq(categoriesTable.id, input.id))
      .returning()
      .execute();

    if (updated.length === 0) {
      throw new Error(`Category with id ${input.id} not found`);
    }
    return updated[0] as Category;
  } catch (error) {
    console.error('Failed to update category:', error);
    throw error;
  }
};
