import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type Category } from '../schema';

export const createCategory = async (input: CreateCategoryInput, userId: number): Promise<Category> => {
  try {
    // Insert category record
    const result = await db.insert(categoriesTable)
      .values({
        name: input.name,
        user_id: userId
      })
      .returning()
      .execute();

    // Return the created category
    const category = result[0];
    return {
      ...category,
      created_at: new Date(category.created_at),
      updated_at: new Date(category.updated_at)
    };
  } catch (error) {
    console.error('Category creation failed:', error);
    throw error;
  }
};
