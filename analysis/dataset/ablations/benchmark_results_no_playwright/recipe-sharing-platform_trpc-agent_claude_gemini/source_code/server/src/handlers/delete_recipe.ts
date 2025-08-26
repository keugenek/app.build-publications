import { db } from '../db';
import { recipesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const deleteRecipe = async (id: number, userId: number): Promise<{ success: boolean }> => {
  try {
    // First, verify the recipe exists and belongs to the user
    const recipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, id))
      .execute();

    if (recipe.length === 0) {
      throw new Error('Recipe not found');
    }

    // Check if the user is the author of the recipe
    if (recipe[0].author_id !== userId) {
      throw new Error('Unauthorized: Only the recipe author can delete this recipe');
    }

    // Delete the recipe - cascade deletes will handle related data
    const result = await db.delete(recipesTable)
      .where(and(
        eq(recipesTable.id, id),
        eq(recipesTable.author_id, userId)
      ))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Recipe deletion failed:', error);
    throw error;
  }
};
