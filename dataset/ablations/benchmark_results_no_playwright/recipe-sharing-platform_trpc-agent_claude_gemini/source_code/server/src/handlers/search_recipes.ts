import { db } from '../db';
import { recipesTable, ingredientsTable, recipeCategoriesTable, usersTable } from '../db/schema';
import { type SearchRecipesInput, type RecipeWithDetails, type RecipeCategory } from '../schema';
import { eq, like, ilike, inArray, and, or, SQL } from 'drizzle-orm';

export async function searchRecipes(input: SearchRecipesInput): Promise<RecipeWithDetails[]> {
  try {
    // Build conditions array for base filtering
    const conditions: SQL<unknown>[] = [];

    // Filter by text query (title or description) - case insensitive
    if (input.query && input.query.trim()) {
      const searchTerm = `%${input.query.trim()}%`;
      conditions.push(
        or(
          ilike(recipesTable.title, searchTerm),
          ilike(recipesTable.description, searchTerm)
        )!
      );
    }

    // Filter by author_id
    if (input.author_id) {
      conditions.push(eq(recipesTable.author_id, input.author_id));
    }

    // Get all recipe IDs that match category filter
    let categoryFilteredIds: number[] | null = null;
    if (input.categories && input.categories.length > 0) {
      const categoryResults = await db.select({
        recipe_id: recipeCategoriesTable.recipe_id
      })
      .from(recipeCategoriesTable)
      .where(inArray(recipeCategoriesTable.category, input.categories))
      .execute();

      categoryFilteredIds = categoryResults.map(r => r.recipe_id);
      
      if (categoryFilteredIds.length === 0) {
        return []; // No recipes match the category filter
      }
    }

    // Get all recipe IDs that match ingredient filter
    let ingredientFilteredIds: number[] | null = null;
    if (input.ingredients && input.ingredients.length > 0) {
      const ingredientConditions: SQL<unknown>[] = input.ingredients.map(ingredient =>
        ilike(ingredientsTable.name, `%${ingredient}%`)
      );

      const ingredientResults = await db.select({
        recipe_id: ingredientsTable.recipe_id
      })
      .from(ingredientsTable)
      .where(ingredientConditions.length === 1 ? ingredientConditions[0] : or(...ingredientConditions))
      .execute();

      ingredientFilteredIds = ingredientResults.map(r => r.recipe_id);
      
      if (ingredientFilteredIds.length === 0) {
        return []; // No recipes match the ingredient filter
      }
    }

    // Combine category and ingredient filters
    let finalFilteredIds: number[] | null = null;
    if (categoryFilteredIds !== null && ingredientFilteredIds !== null) {
      // Both filters applied - intersection
      const categorySet = new Set(categoryFilteredIds);
      finalFilteredIds = ingredientFilteredIds.filter(id => categorySet.has(id));
      
      if (finalFilteredIds.length === 0) {
        return []; // No recipes match both filters
      }
    } else if (categoryFilteredIds !== null) {
      finalFilteredIds = categoryFilteredIds;
    } else if (ingredientFilteredIds !== null) {
      finalFilteredIds = ingredientFilteredIds;
    }

    // Add ID filter if we have filtered IDs
    if (finalFilteredIds !== null) {
      conditions.push(inArray(recipesTable.id, finalFilteredIds));
    }

    // Build and execute final query
    const baseQuery = db.select({
      recipe_id: recipesTable.id,
      title: recipesTable.title,
      description: recipesTable.description,
      instructions: recipesTable.instructions,
      author_id: recipesTable.author_id,
      author_username: usersTable.username,
      created_at: recipesTable.created_at,
      updated_at: recipesTable.updated_at
    })
    .from(recipesTable)
    .innerJoin(usersTable, eq(recipesTable.author_id, usersTable.id));

    // Execute query with or without conditions
    const recipeResults = conditions.length > 0
      ? await baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions)).execute()
      : await baseQuery.execute();

    // If no recipes found, return empty array
    if (recipeResults.length === 0) {
      return [];
    }

    // Get all ingredients for the found recipes
    const recipeIds = recipeResults.map(r => r.recipe_id);
    
    const ingredients = await db.select()
      .from(ingredientsTable)
      .where(inArray(ingredientsTable.recipe_id, recipeIds))
      .execute();

    // Get all categories for the found recipes
    const categories = await db.select()
      .from(recipeCategoriesTable)
      .where(inArray(recipeCategoriesTable.recipe_id, recipeIds))
      .execute();

    // Group ingredients and categories by recipe_id
    const ingredientsByRecipe = ingredients.reduce((acc, ingredient) => {
      if (!acc[ingredient.recipe_id]) {
        acc[ingredient.recipe_id] = [];
      }
      acc[ingredient.recipe_id].push(ingredient);
      return acc;
    }, {} as Record<number, typeof ingredients>);

    const categoriesByRecipe = categories.reduce((acc, category) => {
      if (!acc[category.recipe_id]) {
        acc[category.recipe_id] = [];
      }
      acc[category.recipe_id].push(category.category);
      return acc;
    }, {} as Record<number, RecipeCategory[]>);

    // Build final result with all related data
    return recipeResults.map(recipe => ({
      id: recipe.recipe_id,
      title: recipe.title,
      description: recipe.description,
      instructions: recipe.instructions,
      author_id: recipe.author_id,
      author_username: recipe.author_username,
      created_at: recipe.created_at,
      updated_at: recipe.updated_at,
      ingredients: ingredientsByRecipe[recipe.recipe_id] || [],
      categories: categoriesByRecipe[recipe.recipe_id] || []
    }));

  } catch (error) {
    console.error('Recipe search failed:', error);
    throw error;
  }
}
