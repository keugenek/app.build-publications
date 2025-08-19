import { db } from '../db';
import { savedRecipesTable } from '../db/schema';
import { type UnsaveRecipeInput } from '../schema';
import { and, eq } from 'drizzle-orm';

export async function unsaveRecipe(input: UnsaveRecipeInput): Promise<{ success: boolean; message: string }> {
  try {
    // Check if the saved recipe record exists
    const existingRecord = await db.select()
      .from(savedRecipesTable)
      .where(
        and(
          eq(savedRecipesTable.user_id, input.user_id),
          eq(savedRecipesTable.recipe_id, input.recipe_id)
        )
      )
      .execute();

    // If no record found, return failure
    if (existingRecord.length === 0) {
      return {
        success: false,
        message: `Recipe ${input.recipe_id} was not found in user ${input.user_id}'s saved collection`
      };
    }

    // Delete the saved recipe record
    await db.delete(savedRecipesTable)
      .where(
        and(
          eq(savedRecipesTable.user_id, input.user_id),
          eq(savedRecipesTable.recipe_id, input.recipe_id)
        )
      )
      .execute();

    return {
      success: true,
      message: `Recipe ${input.recipe_id} removed from user ${input.user_id}'s collection`
    };
  } catch (error) {
    console.error('Unsave recipe operation failed:', error);
    throw error;
  }
}
