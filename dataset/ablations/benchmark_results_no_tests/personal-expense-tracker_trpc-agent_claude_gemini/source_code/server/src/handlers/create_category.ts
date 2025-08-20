import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type Category } from '../schema';
import { eq } from 'drizzle-orm';

export const createCategory = async (input: CreateCategoryInput): Promise<Category> => {
  try {
    // Check if category name already exists (case-insensitive)
    const existingCategories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.name, input.name))
      .execute();

    if (existingCategories.length > 0) {
      throw new Error(`Category with name "${input.name}" already exists`);
    }

    // Insert category record
    const result = await db.insert(categoriesTable)
      .values({
        name: input.name,
        color: input.color || null // Handle optional color field
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Category creation failed:', error);
    throw error;
  }
};
