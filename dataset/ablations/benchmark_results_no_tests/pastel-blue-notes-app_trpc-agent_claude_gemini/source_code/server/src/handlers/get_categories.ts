import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type Category, type GetNotesByUserInput } from '../schema';
import { eq } from 'drizzle-orm';

export const getCategories = async (input: GetNotesByUserInput): Promise<Category[]> => {
  try {
    // Fetch all categories for the specified user
    const results = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.user_id, input.user_id))
      .execute();

    return results;
  } catch (error) {
    console.error('Get categories failed:', error);
    throw error;
  }
};
