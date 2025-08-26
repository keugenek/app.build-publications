import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe } from '../schema';

export const getRecipes = async (): Promise<Recipe[]> => {
  try {
    // Fetch all recipes from the database
    const results = await db.select()
      .from(recipesTable)
      .execute();

    // Convert the results to match the schema format
    return results.map(recipe => ({
      ...recipe,
      created_at: recipe.created_at // Date objects are handled correctly by Drizzle
    }));
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    throw error;
  }
};
