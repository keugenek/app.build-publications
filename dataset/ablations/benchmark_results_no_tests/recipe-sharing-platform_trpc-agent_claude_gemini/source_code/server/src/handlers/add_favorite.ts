import { db } from '../db';
import { favoriteRecipesTable, recipesTable, usersTable } from '../db/schema';
import { type AddFavoriteInput, type FavoriteRecipe } from '../schema';
import { eq, and } from 'drizzle-orm';

export const addFavorite = async (input: AddFavoriteInput): Promise<FavoriteRecipe> => {
  try {
    // 1. Verify the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with ID ${input.user_id} not found`);
    }

    // 2. Verify the recipe exists
    const recipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, input.recipe_id))
      .execute();

    if (recipe.length === 0) {
      throw new Error(`Recipe with ID ${input.recipe_id} not found`);
    }

    // 3. Check if already favorited (prevent duplicates)
    const existingFavorite = await db.select()
      .from(favoriteRecipesTable)
      .where(
        and(
          eq(favoriteRecipesTable.user_id, input.user_id),
          eq(favoriteRecipesTable.recipe_id, input.recipe_id)
        )
      )
      .execute();

    if (existingFavorite.length > 0) {
      throw new Error('Recipe is already in user\'s favorites');
    }

    // 4. Insert into favorite_recipes table
    const result = await db.insert(favoriteRecipesTable)
      .values({
        user_id: input.user_id,
        recipe_id: input.recipe_id
      })
      .returning()
      .execute();

    // 5. Return the created favorite record
    return result[0];
  } catch (error) {
    console.error('Add favorite failed:', error);
    throw error;
  }
};
