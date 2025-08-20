import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getUserRecipes = async (userId: number): Promise<Recipe[]> => {
  try {
    // Query recipes created by the specific user
    const results = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.user_id, userId))
      .orderBy(desc(recipesTable.created_at))
      .execute();

    // Return recipes with proper date parsing and JSON field typing
    return results.map(recipe => ({
      ...recipe,
      ingredients: recipe.ingredients as string[],
      instructions: recipe.instructions as string[],
      created_at: new Date(recipe.created_at),
      updated_at: new Date(recipe.updated_at)
    }));
  } catch (error) {
    console.error('Failed to get user recipes:', error);
    throw error;
  }
};
