import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type GetUserCategoriesInput, type Category } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getUserCategories = async (input: GetUserCategoriesInput): Promise<Category[]> => {
  try {
    // Query categories for the specific user, ordered by name for consistent results
    const results = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.user_id, input.user_id))
      .orderBy(asc(categoriesTable.name))
      .execute();

    return results;
  } catch (error) {
    console.error('Get user categories failed:', error);
    throw error;
  }
};
