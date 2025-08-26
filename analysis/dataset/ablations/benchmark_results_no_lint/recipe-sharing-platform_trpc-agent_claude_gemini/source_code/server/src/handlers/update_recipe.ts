import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type UpdateRecipeInput, type Recipe } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function updateRecipe(input: UpdateRecipeInput): Promise<Recipe | null> {
  try {
    // First, verify the recipe exists and belongs to the user
    const existingRecipe = await db.select()
      .from(recipesTable)
      .where(
        and(
          eq(recipesTable.id, input.id),
          eq(recipesTable.user_id, input.user_id)
        )
      )
      .execute();

    if (existingRecipe.length === 0) {
      return null; // Recipe not found or doesn't belong to user
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof recipesTable.$inferInsert> = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.ingredients !== undefined) {
      updateData.ingredients = input.ingredients;
    }
    
    if (input.instructions !== undefined) {
      updateData.instructions = input.instructions;
    }
    
    if (input.prep_time_minutes !== undefined) {
      updateData.prep_time_minutes = input.prep_time_minutes;
    }
    
    if (input.cook_time_minutes !== undefined) {
      updateData.cook_time_minutes = input.cook_time_minutes;
    }
    
    if (input.servings !== undefined) {
      updateData.servings = input.servings;
    }
    
    if (input.category !== undefined) {
      updateData.category = input.category;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Perform the update
    const result = await db.update(recipesTable)
      .set(updateData)
      .where(
        and(
          eq(recipesTable.id, input.id),
          eq(recipesTable.user_id, input.user_id)
        )
      )
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Return the updated recipe
    return result[0] as Recipe;
  } catch (error) {
    console.error('Recipe update failed:', error);
    throw error;
  }
}
