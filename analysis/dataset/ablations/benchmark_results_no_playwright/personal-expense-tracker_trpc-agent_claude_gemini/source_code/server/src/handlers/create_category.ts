import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type Category } from '../schema';
import { eq } from 'drizzle-orm';

export const createCategory = async (input: CreateCategoryInput): Promise<Category> => {
  try {
    // Check for duplicate category names (case-insensitive)
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.name, input.name))
      .limit(1)
      .execute();

    if (existingCategory.length > 0) {
      throw new Error(`Category with name "${input.name}" already exists`);
    }

    // Insert new category record
    const result = await db.insert(categoriesTable)
      .values({
        name: input.name,
        is_predefined: false // Custom categories are not predefined
      })
      .returning()
      .execute();

    const category = result[0];
    return {
      ...category
    };
  } catch (error) {
    console.error('Category creation failed:', error);
    throw error;
  }
};
