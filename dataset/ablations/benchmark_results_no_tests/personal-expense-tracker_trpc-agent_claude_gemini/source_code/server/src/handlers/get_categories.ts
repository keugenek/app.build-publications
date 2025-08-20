import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type Category } from '../schema';
import { asc } from 'drizzle-orm';

export const getCategories = async (): Promise<Category[]> => {
  try {
    // Fetch all categories ordered by name for consistent UI display
    const categories = await db.select()
      .from(categoriesTable)
      .orderBy(asc(categoriesTable.name))
      .execute();

    return categories;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
};
