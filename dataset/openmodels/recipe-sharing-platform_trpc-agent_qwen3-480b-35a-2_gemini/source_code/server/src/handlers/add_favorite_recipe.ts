import { db } from '../db';
import { userFavoriteRecipesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const addFavoriteRecipe = async (userId: number, recipeId: number): Promise<void> => {
  try {
    // First check if the favorite already exists
    const existingFavorites = await db.select()
      .from(userFavoriteRecipesTable)
      .where(
        eq(userFavoriteRecipesTable.user_id, userId) &&
        eq(userFavoriteRecipesTable.recipe_id, recipeId)
      )
      .execute();
    
    // If it doesn't exist, insert it
    if (existingFavorites.length === 0) {
      await db.insert(userFavoriteRecipesTable)
        .values({
          user_id: userId,
          recipe_id: recipeId,
        })
        .execute();
    }
  } catch (error) {
    console.error('Failed to add favorite recipe:', error);
    throw error;
  }
};
