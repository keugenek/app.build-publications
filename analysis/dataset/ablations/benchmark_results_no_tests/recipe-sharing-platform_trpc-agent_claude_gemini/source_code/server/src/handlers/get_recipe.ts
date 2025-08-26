import { db } from '../db';
import { recipesTable, usersTable, categoriesTable, recipeCategoriesTable, favoriteRecipesTable } from '../db/schema';
import { type RecipeWithDetails } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getRecipe = async (recipeId: number, viewingUserId?: number): Promise<RecipeWithDetails | null> => {
  try {
    // First, get the recipe with user information
    const recipeWithUser = await db.select()
      .from(recipesTable)
      .innerJoin(usersTable, eq(recipesTable.user_id, usersTable.id))
      .where(eq(recipesTable.id, recipeId))
      .execute();

    if (recipeWithUser.length === 0) {
      return null;
    }

    const recipeData = recipeWithUser[0];

    // Get associated categories
    const recipeCategories = await db.select({
      category: categoriesTable
    })
      .from(recipeCategoriesTable)
      .innerJoin(categoriesTable, eq(recipeCategoriesTable.category_id, categoriesTable.id))
      .where(eq(recipeCategoriesTable.recipe_id, recipeId))
      .execute();

    const categories = recipeCategories.map(rc => rc.category);

    // Check if viewing user has this recipe in favorites
    let isFavorite = false;
    if (viewingUserId) {
      const favoriteCheck = await db.select()
        .from(favoriteRecipesTable)
        .where(and(
          eq(favoriteRecipesTable.user_id, viewingUserId),
          eq(favoriteRecipesTable.recipe_id, recipeId)
        ))
        .execute();

      isFavorite = favoriteCheck.length > 0;
    }

    // Build the complete recipe with details
    const result: RecipeWithDetails = {
      id: recipeData.recipes.id,
      title: recipeData.recipes.title,
      description: recipeData.recipes.description,
      ingredients: recipeData.recipes.ingredients as string[],
      instructions: recipeData.recipes.instructions as string[],
      prep_time_minutes: recipeData.recipes.prep_time_minutes,
      cook_time_minutes: recipeData.recipes.cook_time_minutes,
      servings: recipeData.recipes.servings,
      user_id: recipeData.recipes.user_id,
      created_at: recipeData.recipes.created_at,
      updated_at: recipeData.recipes.updated_at,
      user: {
        id: recipeData.users.id,
        username: recipeData.users.username,
        email: recipeData.users.email,
        created_at: recipeData.users.created_at
      },
      categories: categories,
      is_favorite: viewingUserId ? isFavorite : undefined
    };

    return result;
  } catch (error) {
    console.error('Recipe retrieval failed:', error);
    throw error;
  }
};
