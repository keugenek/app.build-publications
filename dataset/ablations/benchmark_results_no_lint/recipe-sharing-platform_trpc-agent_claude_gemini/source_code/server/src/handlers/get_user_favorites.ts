import { db } from '../db';
import { recipesTable, usersTable, favoriteRecipesTable } from '../db/schema';
import { type RecipeWithUser } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getUserFavorites(userId: number): Promise<RecipeWithUser[]> {
    try {
        // Join favorite_recipes, recipes, and users tables to get complete recipe information
        // with author details for all recipes favorited by the specified user
        const results = await db.select({
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
            // Author information
            user_name: usersTable.name,
            // Favorite creation date for ordering
            favorite_created_at: favoriteRecipesTable.created_at
        })
        .from(favoriteRecipesTable)
        .innerJoin(recipesTable, eq(favoriteRecipesTable.recipe_id, recipesTable.id))
        .innerJoin(usersTable, eq(recipesTable.user_id, usersTable.id))
        .where(eq(favoriteRecipesTable.user_id, userId))
        .orderBy(desc(favoriteRecipesTable.created_at)) // Order by when favorite was created (newest first)
        .execute();

        // Transform results to match RecipeWithUser schema
        return results.map(result => ({
            id: result.id,
            title: result.title,
            description: result.description,
            ingredients: result.ingredients,
            instructions: result.instructions,
            prep_time_minutes: result.prep_time_minutes,
            cook_time_minutes: result.cook_time_minutes,
            servings: result.servings,
            category: result.category,
            user_id: result.user_id,
            created_at: result.created_at,
            updated_at: result.updated_at,
            user_name: result.user_name,
            is_favorite: true // Always true for favorites list
        }));
    } catch (error) {
        console.error('Failed to fetch user favorites:', error);
        throw error;
    }
}
