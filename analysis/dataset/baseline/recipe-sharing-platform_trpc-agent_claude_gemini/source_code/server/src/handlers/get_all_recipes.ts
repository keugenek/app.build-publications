import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe } from '../schema';
import { desc } from 'drizzle-orm';

export const getAllRecipes = async (): Promise<Recipe[]> => {
  try {
    // Fetch all recipes ordered by creation date (newest first)
    const results = await db.select()
      .from(recipesTable)
      .orderBy(desc(recipesTable.created_at))
      .execute();

    // Return the recipes - JSON fields need proper typing
    return results.map(recipe => ({
      ...recipe,
      // Cast JSON fields to proper types
      ingredients: recipe.ingredients as string[],
      instructions: recipe.instructions as string[],
      categories: recipe.categories as Recipe['categories'],
      // Ensure dates are proper Date objects
      created_at: new Date(recipe.created_at),
      updated_at: new Date(recipe.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch all recipes:', error);
    throw error;
  }
};
