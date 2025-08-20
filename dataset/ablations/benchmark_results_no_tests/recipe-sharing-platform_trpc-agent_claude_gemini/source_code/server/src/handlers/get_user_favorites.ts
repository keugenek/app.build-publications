import { db } from '../db';
import { 
  favoriteRecipesTable, 
  recipesTable, 
  usersTable, 
  categoriesTable, 
  recipeCategoriesTable 
} from '../db/schema';
import { type GetUserFavoritesInput, type RecipeWithDetails } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getUserFavorites = async (input: GetUserFavoritesInput): Promise<RecipeWithDetails[]> => {
  try {
    // Query favorite recipes with all related data
    const favoriteResults = await db.select({
      recipe: recipesTable,
      user: usersTable,
      favorite_created_at: favoriteRecipesTable.created_at
    })
      .from(favoriteRecipesTable)
      .innerJoin(recipesTable, eq(favoriteRecipesTable.recipe_id, recipesTable.id))
      .innerJoin(usersTable, eq(recipesTable.user_id, usersTable.id))
      .where(eq(favoriteRecipesTable.user_id, input.user_id))
      .orderBy(desc(favoriteRecipesTable.created_at))
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    if (favoriteResults.length === 0) {
      return [];
    }

    // Get recipe IDs for category lookup
    const recipeIds = favoriteResults.map(result => result.recipe.id);

    // Query categories for all recipes
    const categoryResults = await db.select({
      recipe_id: recipeCategoriesTable.recipe_id,
      category: categoriesTable
    })
      .from(recipeCategoriesTable)
      .innerJoin(categoriesTable, eq(recipeCategoriesTable.category_id, categoriesTable.id))
      .where(eq(recipeCategoriesTable.recipe_id, recipeIds[0]))
      .execute();

    // If we have multiple recipe IDs, we need to query for all of them
    const allCategoryResults = recipeIds.length > 1 
      ? await db.select({
          recipe_id: recipeCategoriesTable.recipe_id,
          category: categoriesTable
        })
        .from(recipeCategoriesTable)
        .innerJoin(categoriesTable, eq(recipeCategoriesTable.category_id, categoriesTable.id))
        .execute()
      : categoryResults;

    // Filter categories for our specific recipes
    const relevantCategories = allCategoryResults.filter(result => 
      recipeIds.includes(result.recipe_id)
    );

    // Group categories by recipe ID
    const categoriesByRecipe = relevantCategories.reduce((acc, result) => {
      if (!acc[result.recipe_id]) {
        acc[result.recipe_id] = [];
      }
      acc[result.recipe_id].push(result.category);
      return acc;
    }, {} as Record<number, typeof categoriesTable.$inferSelect[]>);

    // Build the final result
    const recipes: RecipeWithDetails[] = favoriteResults.map(result => ({
      id: result.recipe.id,
      title: result.recipe.title,
      description: result.recipe.description,
      ingredients: result.recipe.ingredients as string[],
      instructions: result.recipe.instructions as string[],
      prep_time_minutes: result.recipe.prep_time_minutes,
      cook_time_minutes: result.recipe.cook_time_minutes,
      servings: result.recipe.servings,
      user_id: result.recipe.user_id,
      created_at: result.recipe.created_at,
      updated_at: result.recipe.updated_at,
      user: result.user,
      categories: categoriesByRecipe[result.recipe.id] || [],
      is_favorite: true // All results are favorites by definition
    }));

    return recipes;
  } catch (error) {
    console.error('Get user favorites failed:', error);
    throw error;
  }
};
