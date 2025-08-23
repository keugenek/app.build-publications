import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type Category } from '../schema';

export const createCategory = async (input: CreateCategoryInput): Promise<Category> => {
  try {
    // Insert category record
    const result = await db.insert(categoriesTable)
      .values({
        name: input.name
      })
      .returning()
      .execute();

    // Return the created category
    return result[0];
  } catch (error) {
    console.error('Category creation failed:', error);
    throw error;
  }
};
