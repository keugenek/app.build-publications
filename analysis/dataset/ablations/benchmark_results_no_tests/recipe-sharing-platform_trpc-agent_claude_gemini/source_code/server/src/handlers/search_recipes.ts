import { db } from '../db';
import { recipesTable, usersTable, categoriesTable, recipeCategoriesTable } from '../db/schema';
import { type SearchRecipesInput, type RecipeWithDetails } from '../schema';
import { eq, and, or, ilike, inArray, desc, SQL } from 'drizzle-orm';

export const searchRecipes = async (input: SearchRecipesInput): Promise<RecipeWithDetails[]> => {
  try {
    // Build conditions array first
    const conditions: SQL<unknown>[] = [];

    // Text search in title, description, and ingredients (case-insensitive)
    if (input.query) {
      const searchTerm = `%${input.query}%`;
      conditions.push(
        or(
          ilike(recipesTable.title, searchTerm),
          ilike(recipesTable.description, searchTerm),
          ilike(recipesTable.ingredients, searchTerm) // JSON field search
        )!
      );
    }

    // Filter by user ID
    if (input.user_id !== undefined) {
      conditions.push(eq(recipesTable.user_id, input.user_id));
    }

    // Filter by category IDs (requires subquery)
    if (input.category_ids && input.category_ids.length > 0) {
      conditions.push(
        inArray(
          recipesTable.id,
          db.select({ id: recipeCategoriesTable.recipe_id })
            .from(recipeCategoriesTable)
            .where(inArray(recipeCategoriesTable.category_id, input.category_ids))
        )
      );
    }

    // Build the complete query at once
    let query = db.select({
      // Recipe fields
      id: recipesTable.id,
      title: recipesTable.title,
      description: recipesTable.description,
      ingredients: recipesTable.ingredients,
      instructions: recipesTable.instructions,
      prep_time_minutes: recipesTable.prep_time_minutes,
      cook_time_minutes: recipesTable.cook_time_minutes,
      servings: recipesTable.servings,
      user_id: recipesTable.user_id,
      created_at: recipesTable.created_at,
      updated_at: recipesTable.updated_at,
      // User fields
      user_username: usersTable.username,
      user_email: usersTable.email,
      user_created_at: usersTable.created_at,
    })
    .from(recipesTable)
    .innerJoin(usersTable, eq(recipesTable.user_id, usersTable.id))
    .where(conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined)
    .orderBy(desc(recipesTable.created_at))
    .limit(input.limit)
    .offset(input.offset);

    const results = await query.execute();

    // Get recipe IDs for category lookup
    const recipeIds = results.map(r => r.id);
    
    // Fetch categories for all recipes
    const recipeCategories = recipeIds.length > 0 
      ? await db.select({
          recipe_id: recipeCategoriesTable.recipe_id,
          category_id: categoriesTable.id,
          category_name: categoriesTable.name,
          category_description: categoriesTable.description,
          category_created_at: categoriesTable.created_at,
        })
        .from(recipeCategoriesTable)
        .innerJoin(categoriesTable, eq(recipeCategoriesTable.category_id, categoriesTable.id))
        .where(inArray(recipeCategoriesTable.recipe_id, recipeIds))
        .execute()
      : [];

    // Group categories by recipe ID
    const categoriesByRecipe = recipeCategories.reduce((acc, rc) => {
      if (!acc[rc.recipe_id]) {
        acc[rc.recipe_id] = [];
      }
      acc[rc.recipe_id].push({
        id: rc.category_id,
        name: rc.category_name,
        description: rc.category_description,
        created_at: rc.category_created_at,
      });
      return acc;
    }, {} as Record<number, Array<{id: number, name: string, description: string | null, created_at: Date}>>);

    // Transform results to RecipeWithDetails format
    return results.map(result => ({
      id: result.id,
      title: result.title,
      description: result.description,
      ingredients: result.ingredients as string[], // JSON array
      instructions: result.instructions as string[], // JSON array
      prep_time_minutes: result.prep_time_minutes,
      cook_time_minutes: result.cook_time_minutes,
      servings: result.servings,
      user_id: result.user_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
      user: {
        id: result.user_id,
        username: result.user_username,
        email: result.user_email,
        created_at: result.user_created_at,
      },
      categories: categoriesByRecipe[result.id] || [],
    }));
  } catch (error) {
    console.error('Recipe search failed:', error);
    throw error;
  }
};
