import { db } from '../db';
import { favoriteRecipesTable } from '../db/schema';
import { type RemoveFavoriteInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const removeFavorite = async (input: RemoveFavoriteInput): Promise<boolean> => {
  try {
    // Delete the favorite record by user_id and recipe_id
    const result = await db.delete(favoriteRecipesTable)
      .where(
        and(
          eq(favoriteRecipesTable.user_id, input.user_id),
          eq(favoriteRecipesTable.recipe_id, input.recipe_id)
        )
      )
      .execute();

    // Return true if a record was deleted, false if not found
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Remove favorite failed:', error);
    throw error;
  }
};
