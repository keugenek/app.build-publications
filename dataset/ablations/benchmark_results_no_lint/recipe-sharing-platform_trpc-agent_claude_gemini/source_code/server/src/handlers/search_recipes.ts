import { db } from '../db';
import { recipesTable, usersTable, favoriteRecipesTable } from '../db/schema';
import { type SearchRecipesInput, type RecipeWithUser } from '../schema';
import { eq, and, ilike, inArray, or, desc, SQL, sql } from 'drizzle-orm';

export async function searchRecipes(input: SearchRecipesInput, currentUserId?: number): Promise<RecipeWithUser[]> {
  try {
    // Start with base query
    const baseQuery = db
      .select({
        // Recipe fields
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
        // User fields
        user_name: usersTable.name,
      })
      .from(recipesTable)
      .innerJoin(usersTable, eq(recipesTable.user_id, usersTable.id));

    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Filter by query (search in title using case-insensitive ILIKE)
    if (input.query) {
      conditions.push(ilike(recipesTable.title, `%${input.query}%`));
    }

    // Filter by ingredients (check if any ingredient contains search terms)
    if (input.ingredients && input.ingredients.length > 0) {
      // Use SQL function to check if JSON array contains ingredient (case-insensitive)
      const ingredientConditions: SQL<unknown>[] = input.ingredients.map(ingredient => 
        sql`lower(${recipesTable.ingredients}::text) like lower(${'%' + ingredient + '%'})`
      );
      // At least one ingredient should match (use OR for multiple ingredients)
      conditions.push(or(...ingredientConditions)!);
    }

    // Filter by categories
    if (input.categories && input.categories.length > 0) {
      conditions.push(inArray(recipesTable.category, input.categories));
    }

    // Filter by specific user
    if (input.user_id) {
      conditions.push(eq(recipesTable.user_id, input.user_id));
    }

    // Build final query with conditions
    const queryWithConditions = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    // Apply ordering and execute
    const results = await queryWithConditions
      .orderBy(desc(recipesTable.created_at))
      .execute();

    // If currentUserId is provided, we need to check favorites separately
    let favoriteRecipeIds: number[] = [];
    if (currentUserId && results.length > 0) {
      const recipeIds = results.map(r => r.id);
      const favorites = await db
        .select({ recipe_id: favoriteRecipesTable.recipe_id })
        .from(favoriteRecipesTable)
        .where(
          and(
            eq(favoriteRecipesTable.user_id, currentUserId),
            inArray(favoriteRecipesTable.recipe_id, recipeIds)
          )
        )
        .execute();
      
      favoriteRecipeIds = favorites.map(f => f.recipe_id);
    }

    // Transform results to match RecipeWithUser schema
    return results.map(result => ({
      id: result.id,
      title: result.title,
      description: result.description,
      ingredients: result.ingredients as string[],
      instructions: result.instructions as string[],
      prep_time_minutes: result.prep_time_minutes,
      cook_time_minutes: result.cook_time_minutes,
      servings: result.servings,
      category: result.category,
      user_id: result.user_id,
      created_at: result.created_at,
      updated_at: result.updated_at,
      user_name: result.user_name,
      is_favorite: currentUserId ? favoriteRecipeIds.includes(result.id) : undefined
    }));
  } catch (error) {
    console.error('Recipe search failed:', error);
    throw error;
  }
}
