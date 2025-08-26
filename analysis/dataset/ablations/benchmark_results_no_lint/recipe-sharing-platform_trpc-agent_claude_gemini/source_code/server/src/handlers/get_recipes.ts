import { db } from '../db';
import { recipesTable, usersTable, favoriteRecipesTable } from '../db/schema';
import { type RecipeWithUser } from '../schema';
import { eq, desc, and } from 'drizzle-orm';

export async function getRecipes(userId?: number): Promise<RecipeWithUser[]> {
  try {
    if (userId) {
      // Query with favorites information when userId is provided
      const results = await db.select({
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
        user_name: usersTable.name,
        favorite_id: favoriteRecipesTable.id
      })
      .from(recipesTable)
      .innerJoin(usersTable, eq(recipesTable.user_id, usersTable.id))
      .leftJoin(
        favoriteRecipesTable,
        and(
          eq(favoriteRecipesTable.recipe_id, recipesTable.id),
          eq(favoriteRecipesTable.user_id, userId)
        )
      )
      .orderBy(desc(recipesTable.created_at))
      .execute();

      return results.map(result => ({
        id: result.id,
        title: result.title,
        description: result.description,
        ingredients: result.ingredients as string[],
        instructions: result.instructions as string[],
        prep_time_minutes: result.prep_time_minutes,
        cook_time_minutes: result.cook_time_minutes,
        servings: result.servings,
        category: result.category as any,
        user_id: result.user_id,
        created_at: result.created_at,
        updated_at: result.updated_at,
        user_name: result.user_name,
        is_favorite: result.favorite_id !== null
      }));
    } else {
      // Query without favorites information when no userId provided
      const results = await db.select({
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
      .orderBy(desc(recipesTable.created_at))
      .execute();

      return results.map(result => ({
        id: result.id,
        title: result.title,
        description: result.description,
        ingredients: result.ingredients as string[],
        instructions: result.instructions as string[],
        prep_time_minutes: result.prep_time_minutes,
        cook_time_minutes: result.cook_time_minutes,
        servings: result.servings,
        category: result.category as any,
        user_id: result.user_id,
        created_at: result.created_at,
        updated_at: result.updated_at,
        user_name: result.user_name,
        is_favorite: undefined
      }));
    }
  } catch (error) {
    console.error('Failed to get recipes:', error);
    throw error;
  }
}
