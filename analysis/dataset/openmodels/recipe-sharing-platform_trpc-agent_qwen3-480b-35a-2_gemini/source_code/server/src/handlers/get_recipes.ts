import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe } from '../schema';

export const getRecipes = async (): Promise<Recipe[]> => {
  try {
    const results = await db.select()
      .from(recipesTable)
      .execute();

    // Convert results to match the Recipe schema
    return results.map(recipe => ({
      ...recipe,
      created_at: new Date(recipe.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    throw error;
  }
};
