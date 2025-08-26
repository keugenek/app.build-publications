import { type FavoriteRecipeInput, type Recipe } from '../schema';
import { db } from '../db';
import { recipesTable, favoritesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Placeholder handler for marking a recipe as favorite by the authenticated user.
 * In a real implementation this would insert a record into the favorites table.
 */
export async function favoriteRecipe(input: FavoriteRecipeInput): Promise<Recipe> {
  // In a real scenario, the authenticated user's ID would be obtained from the request context.
  // For this simplified implementation we assume a user with ID 1 exists.
  const userId = 1;

  try {
    // Verify that the recipe exists
    const recipeResult = await db
      .select()
      .from(recipesTable)
      .where(eq(recipesTable.id, input.recipe_id))
      .execute();

    if (recipeResult.length === 0) {
      throw new Error('Recipe not found');
    }

    const recipe = recipeResult[0];

    // Insert a favorite record linking the user and the recipe
    await db
      .insert(favoritesTable)
      .values({
        user_id: userId,
        recipe_id: input.recipe_id
      })
      .execute();

    // Return the recipe in the shape expected by the Zod schema
    return {
      id: recipe.id,
      name: recipe.name,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      categories: recipe.categories ?? null,
      created_at: recipe.created_at
    } as Recipe;
  } catch (error) {
    console.error('Failed to favorite recipe:', error);
    throw error;
  }
}
