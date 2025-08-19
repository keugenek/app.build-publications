import { db } from '../db';
import { savedRecipesTable, usersTable, recipesTable } from '../db/schema';
import { type SaveRecipeInput, type SavedRecipe } from '../schema';
import { eq, and } from 'drizzle-orm';

export const saveRecipe = async (input: SaveRecipeInput): Promise<SavedRecipe> => {
  try {
    // First, validate that both user and recipe exist
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    const recipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, input.recipe_id))
      .execute();

    if (recipe.length === 0) {
      throw new Error('Recipe not found');
    }

    // Check if the recipe is already saved by this user
    const existingSavedRecipe = await db.select()
      .from(savedRecipesTable)
      .where(
        and(
          eq(savedRecipesTable.user_id, input.user_id),
          eq(savedRecipesTable.recipe_id, input.recipe_id)
        )
      )
      .execute();

    // If already saved, return the existing record
    if (existingSavedRecipe.length > 0) {
      return existingSavedRecipe[0];
    }

    // Create new saved recipe record
    const result = await db.insert(savedRecipesTable)
      .values({
        user_id: input.user_id,
        recipe_id: input.recipe_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Recipe save failed:', error);
    throw error;
  }
};
