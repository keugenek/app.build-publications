import { db } from '../db';
import { usersTable, userFavoritesTable, recipesTable, ingredientsTable, recipeCategoriesTable } from '../db/schema';
import { type GetUserFavoritesInput, type RecipeWithDetails } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getUserFavorites(input: GetUserFavoritesInput): Promise<RecipeWithDetails[]> {
  try {
    // Get all favorite recipe IDs for the user, ordered by when they were favorited (most recent first)
    const favorites = await db.select({
      recipe_id: userFavoritesTable.recipe_id,
      favorited_at: userFavoritesTable.created_at
    })
      .from(userFavoritesTable)
      .where(eq(userFavoritesTable.user_id, input.user_id))
      .orderBy(desc(userFavoritesTable.created_at))
      .execute();

    if (favorites.length === 0) {
      return [];
    }

    // Get detailed information for each favorited recipe
    const recipeDetails: RecipeWithDetails[] = [];

    for (const favorite of favorites) {
      // Get recipe with author information
      const recipeData = await db.select({
        id: recipesTable.id,
        title: recipesTable.title,
        description: recipesTable.description,
        instructions: recipesTable.instructions,
        author_id: recipesTable.author_id,
        author_username: usersTable.username,
        created_at: recipesTable.created_at,
        updated_at: recipesTable.updated_at
      })
        .from(recipesTable)
        .innerJoin(usersTable, eq(recipesTable.author_id, usersTable.id))
        .where(eq(recipesTable.id, favorite.recipe_id))
        .execute();

      if (recipeData.length === 0) continue;

      const recipe = recipeData[0];

      // Get ingredients for this recipe
      const ingredients = await db.select()
        .from(ingredientsTable)
        .where(eq(ingredientsTable.recipe_id, recipe.id))
        .execute();

      // Get categories for this recipe
      const categoryData = await db.select({
        category: recipeCategoriesTable.category
      })
        .from(recipeCategoriesTable)
        .where(eq(recipeCategoriesTable.recipe_id, recipe.id))
        .execute();

      const categories = categoryData.map(c => c.category);

      // Combine all data into RecipeWithDetails format
      recipeDetails.push({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        instructions: recipe.instructions,
        author_id: recipe.author_id,
        author_username: recipe.author_username,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
        ingredients: ingredients,
        categories: categories
      });
    }

    return recipeDetails;
  } catch (error) {
    console.error('Failed to get user favorites:', error);
    throw error;
  }
}
