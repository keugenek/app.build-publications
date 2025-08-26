import { db } from '../db';
import { recipesTable, favoriteRecipesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function deleteRecipe(recipeId: number, userId: number): Promise<boolean> {
  try {
    // First verify the recipe exists and belongs to the user
    const recipe = await db.select()
      .from(recipesTable)
      .where(and(
        eq(recipesTable.id, recipeId),
        eq(recipesTable.user_id, userId)
      ))
      .execute();

    // If recipe doesn't exist or doesn't belong to the user, return false
    if (recipe.length === 0) {
      return false;
    }

    // Delete associated favorite records first (to avoid foreign key constraint violations)
    await db.delete(favoriteRecipesTable)
      .where(eq(favoriteRecipesTable.recipe_id, recipeId))
      .execute();

    // Delete the recipe
    const deleteResult = await db.delete(recipesTable)
      .where(and(
        eq(recipesTable.id, recipeId),
        eq(recipesTable.user_id, userId)
      ))
      .execute();

    // Return true if deletion was successful
    return (deleteResult.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Recipe deletion failed:', error);
    throw error;
  }
}
