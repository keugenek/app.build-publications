import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe } from '../schema';
import { desc } from 'drizzle-orm';

export const getRecipes = async (): Promise<Recipe[]> => {
  try {
    // Fetch all recipes ordered by creation date (newest first)
    const results = await db.select()
      .from(recipesTable)
      .orderBy(desc(recipesTable.created_at))
      .execute();

    // Return the results (no numeric conversion needed - all fields are already correct types)
    return results;
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    throw error;
  }
};
