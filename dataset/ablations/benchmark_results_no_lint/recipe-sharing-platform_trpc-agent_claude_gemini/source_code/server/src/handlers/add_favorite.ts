import { db } from '../db';
import { favoriteRecipesTable, recipesTable } from '../db/schema';
import { type ManageFavoriteInput, type FavoriteRecipe } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function addFavorite(input: ManageFavoriteInput): Promise<FavoriteRecipe | null> {
  try {
    // 1. Verify the recipe exists in the database
    const recipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, input.recipe_id))
      .execute();

    if (recipe.length === 0) {
      return null; // Recipe not found
    }

    // 2. Check if user has already favorited this recipe (prevent duplicates)
    const existingFavorite = await db.select()
      .from(favoriteRecipesTable)
      .where(and(
        eq(favoriteRecipesTable.user_id, input.user_id),
        eq(favoriteRecipesTable.recipe_id, input.recipe_id)
      ))
      .execute();

    if (existingFavorite.length > 0) {
      return null; // Already favorited
    }

    // 3. Create new favorite record
    const result = await db.insert(favoriteRecipesTable)
      .values({
        user_id: input.user_id,
        recipe_id: input.recipe_id
      })
      .returning()
      .execute();

    // 4. Return the created favorite record
    return result[0];
  } catch (error) {
    console.error('Add favorite failed:', error);
    throw error;
  }
}
