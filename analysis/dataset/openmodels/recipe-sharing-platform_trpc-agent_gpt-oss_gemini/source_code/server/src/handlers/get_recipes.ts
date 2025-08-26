import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe } from '../schema';

/**
 * Handler for fetching all recipes from the database.
 * Returns an array of Recipe objects.
 */
export async function getRecipes(): Promise<Recipe[]> {
  try {
    const rows = await db.select().from(recipesTable).execute();
    // No numeric conversion needed – all fields already have correct types.
    return rows.map(row => ({
      ...row,
      // Cast JSONB fields to string arrays as defined in schema
      ingredients: row.ingredients as string[],
      categories: row.categories as string[],
    }));
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    throw error;
  }
}
