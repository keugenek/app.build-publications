import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type Category } from '../schema';

export const getCategories = async (): Promise<Category[]> => {
  try {
    const results = await db.select()
      .from(categoriesTable)
      .execute();

    // Convert date strings to Date objects
    return results.map(category => ({
      ...category,
      created_at: new Date(category.created_at),
      updated_at: new Date(category.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
};
