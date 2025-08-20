import { db } from '../db';
import { usersTable, recipesTable, userFavoritesTable } from '../db/schema';
import { type AddToFavoritesInput, type UserFavorite } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function addToFavorites(input: AddToFavoritesInput): Promise<UserFavorite> {
  try {
    // 1. Verify the user exists
    const userExists = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // 2. Verify the recipe exists
    const recipeExists = await db.select({ id: recipesTable.id })
      .from(recipesTable)
      .where(eq(recipesTable.id, input.recipe_id))
      .execute();

    if (recipeExists.length === 0) {
      throw new Error(`Recipe with id ${input.recipe_id} not found`);
    }

    // 3. Check if the recipe is already in user's favorites
    const existingFavorite = await db.select()
      .from(userFavoritesTable)
      .where(and(
        eq(userFavoritesTable.user_id, input.user_id),
        eq(userFavoritesTable.recipe_id, input.recipe_id)
      ))
      .execute();

    // If already exists, return the existing favorite
    if (existingFavorite.length > 0) {
      return existingFavorite[0];
    }

    // 4. Create a new favorite record
    const result = await db.insert(userFavoritesTable)
      .values({
        user_id: input.user_id,
        recipe_id: input.recipe_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Adding to favorites failed:', error);
    throw error;
  }
}
