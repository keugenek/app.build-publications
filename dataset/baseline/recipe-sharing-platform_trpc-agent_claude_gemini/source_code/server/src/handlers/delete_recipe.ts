import { db } from '../db';
import { recipesTable, savedRecipesTable } from '../db/schema';
import { type DeleteRecipeInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function deleteRecipe(input: DeleteRecipeInput): Promise<{ success: boolean; message: string }> {
  try {
    // First, verify the recipe exists and belongs to the author
    const existingRecipes = await db.select()
      .from(recipesTable)
      .where(and(
        eq(recipesTable.id, input.id),
        eq(recipesTable.author_id, input.author_id)
      ))
      .execute();

    if (existingRecipes.length === 0) {
      return {
        success: false,
        message: 'Recipe not found or you are not authorized to delete this recipe'
      };
    }

    // Delete all saved recipe references first (to avoid foreign key constraint violations)
    await db.delete(savedRecipesTable)
      .where(eq(savedRecipesTable.recipe_id, input.id))
      .execute();

    // Then delete the recipe itself
    await db.delete(recipesTable)
      .where(and(
        eq(recipesTable.id, input.id),
        eq(recipesTable.author_id, input.author_id)
      ))
      .execute();

    return {
      success: true,
      message: `Recipe ${input.id} deleted successfully`
    };
  } catch (error) {
    console.error('Recipe deletion failed:', error);
    throw error;
  }
}
