import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe } from '../schema';

/**
 * Retrieves all recipes from the database.
 * Returns an array of {@link Recipe} objects.
 */
export const getRecipes = async (): Promise<Recipe[]> => {
  try {
    const rows = await db.select().from(recipesTable).execute();
    // Cast JSONB fields (ingredients, categories) to string[] for the Recipe type.
    return rows.map(row => ({
      ...row,
      ingredients: row.ingredients as unknown as string[],
      categories: row.categories as unknown as string[],
    }));
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    throw error;
  }
};
