import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type Category } from '../schema';
import { desc } from 'drizzle-orm';

export async function getCategories(): Promise<Category[]> {
  try {
    // Fetch all categories ordered by creation date (newest first)
    const results = await db.select()
      .from(categoriesTable)
      .orderBy(desc(categoriesTable.created_at))
      .execute();

    // Return results - no numeric conversion needed for categories table
    return results;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
}
