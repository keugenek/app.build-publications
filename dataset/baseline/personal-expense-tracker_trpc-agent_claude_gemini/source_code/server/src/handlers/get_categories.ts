import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type Category } from '../schema';

export async function getCategories(): Promise<Category[]> {
  try {
    // Fetch all categories from the database
    const results = await db.select()
      .from(categoriesTable)
      .execute();

    // Return the results - no numeric conversions needed for categories
    return results;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
}
