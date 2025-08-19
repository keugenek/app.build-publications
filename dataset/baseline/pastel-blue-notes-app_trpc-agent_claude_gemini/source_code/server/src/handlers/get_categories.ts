import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type Category } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getCategories = async (userId: number): Promise<Category[]> => {
  try {
    const results = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.user_id, userId))
      .orderBy(asc(categoriesTable.name))
      .execute();

    // Return results with proper type mapping
    return results.map(category => ({
      ...category,
      color: category.color || null // Ensure null for nullable field
    }));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
};
