import { db } from '../db';
import { recipesTable, usersTable, favoriteRecipesTable } from '../db/schema';
import { type RecipeWithUser } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getRecipeById(recipeId: number, userId?: number): Promise<RecipeWithUser | null> {
  try {
    // First, get the recipe with user information
    const recipeResult = await db.select({
      id: recipesTable.id,
      title: recipesTable.title,
      description: recipesTable.description,
      ingredients: recipesTable.ingredients,
      instructions: recipesTable.instructions,
      prep_time_minutes: recipesTable.prep_time_minutes,
      cook_time_minutes: recipesTable.cook_time_minutes,
      servings: recipesTable.servings,
      category: recipesTable.category,
      user_id: recipesTable.user_id,
      created_at: recipesTable.created_at,
      updated_at: recipesTable.updated_at,
      user_name: usersTable.name
    })
    .from(recipesTable)
    .innerJoin(usersTable, eq(recipesTable.user_id, usersTable.id))
    .where(eq(recipesTable.id, recipeId))
    .limit(1)
    .execute();

    if (recipeResult.length === 0) {
      return null;
    }

    const recipe = recipeResult[0];

    // If userId is provided, check if the user has favorited this recipe
    let is_favorite: boolean | undefined = undefined;
    if (userId !== undefined) {
      const favoriteResult = await db.select()
        .from(favoriteRecipesTable)
        .where(
          and(
            eq(favoriteRecipesTable.user_id, userId),
            eq(favoriteRecipesTable.recipe_id, recipeId)
          )
        )
        .limit(1)
        .execute();

      is_favorite = favoriteResult.length > 0;
    }

    return {
      ...recipe,
      is_favorite
    };
  } catch (error) {
    console.error('Failed to get recipe by ID:', error);
    throw error;
  }
}
