import { db } from '../db';
import { favoriteRecipesTable } from '../db/schema';
import { type ManageFavoriteInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function removeFavorite(input: ManageFavoriteInput): Promise<boolean> {
  try {
    // Delete the favorite record for the user and recipe combination
    const result = await db.delete(favoriteRecipesTable)
      .where(
        and(
          eq(favoriteRecipesTable.user_id, input.user_id),
          eq(favoriteRecipesTable.recipe_id, input.recipe_id)
        )
      )
      .execute();

    // Return true if a record was actually deleted, false if no favorite was found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Remove favorite failed:', error);
    throw error;
  }
}
