import { type Recipe } from '../schema';
import { db } from '../db';
import { recipesTable } from '../db/schema';

/**
 * Placeholder handler for fetching all recipes.
 * Real implementation would query the database.
 */
export async function getRecipes(): Promise<Recipe[]> {
  try {
    const rows = await db.select().from(recipesTable).execute();
    // rows already match the Recipe type
    return rows as Recipe[];
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    throw error;
  }
}
