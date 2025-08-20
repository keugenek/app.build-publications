import { db } from '../db';
import { recipesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const deleteRecipe = async (recipeId: number, userId: number): Promise<boolean> => {
  try {
    // Delete the recipe only if it exists and belongs to the user
    const result = await db.delete(recipesTable)
      .where(and(
        eq(recipesTable.id, recipeId),
        eq(recipesTable.user_id, userId)
      ))
      .execute();

    // Return true if a record was deleted, false otherwise
    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error('Recipe deletion failed:', error);
    throw error;
  }
};
