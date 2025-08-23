import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type Category } from '../schema';

export const createCategory = async (input: CreateCategoryInput): Promise<Category> => {
  try {
    const result = await db.insert(categoriesTable)
      .values({
        name: input.name,
        slug: input.slug,
        description: input.description
      })
      .returning()
      .execute();

    const category = result[0];
    return {
      ...category,
      created_at: new Date(category.created_at)
    };
  } catch (error) {
    console.error('Category creation failed:', error);
    throw error;
  }
};
