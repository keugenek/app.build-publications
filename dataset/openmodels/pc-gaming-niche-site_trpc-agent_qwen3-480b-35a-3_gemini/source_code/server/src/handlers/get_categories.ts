import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type Category } from '../schema';

export const getCategories = async (): Promise<Category[]> => {
  try {
    const results = await db.select()
      .from(categoriesTable)
      .execute();

    // Map results to ensure proper date handling
    return results.map(category => ({
      ...category,
      created_at: category.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
};
