import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type Category } from '../schema';
import { asc } from 'drizzle-orm';

export const getCategories = async (): Promise<Category[]> => {
  try {
    // Fetch all categories ordered by name for better UX
    const results = await db.select()
      .from(categoriesTable)
      .orderBy(asc(categoriesTable.name))
      .execute();

    // Return results directly as they match the Category schema
    return results;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
};
