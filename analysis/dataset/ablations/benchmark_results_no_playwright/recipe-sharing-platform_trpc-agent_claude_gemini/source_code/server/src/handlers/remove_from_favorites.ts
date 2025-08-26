import { db } from '../db';
import { userFavoritesTable } from '../db/schema';
import { type RemoveFromFavoritesInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const removeFromFavorites = async (input: RemoveFromFavoritesInput): Promise<{ success: boolean }> => {
  try {
    // Delete the favorite record by user_id and recipe_id
    const result = await db.delete(userFavoritesTable)
      .where(
        and(
          eq(userFavoritesTable.user_id, input.user_id),
          eq(userFavoritesTable.recipe_id, input.recipe_id)
        )
      )
      .returning()
      .execute();

    // Return success: true regardless of whether a record was found and deleted
    // This provides idempotent behavior - calling remove multiple times is safe
    return { success: true };
  } catch (error) {
    console.error('Remove from favorites failed:', error);
    throw error;
  }
};
