import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Category } from '../schema';

export const getCategories = async (userId: number): Promise<Category[]> => {
  try {
    const results = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.user_id, userId))
      .orderBy(categoriesTable.name)
      .execute();

    // Convert results to match the Category schema
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
