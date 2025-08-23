import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type Category } from '../schema';

export const getCategories = async (): Promise<Category[]> => {
  try {
    const results = await db.select()
      .from(categoriesTable)
      .execute();
    
    return results;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
};
