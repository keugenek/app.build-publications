import { db } from '../db';
import { recipesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateRecipeInput, type Recipe } from '../schema';

export const updateRecipe = async (input: UpdateRecipeInput): Promise<Recipe> => {
  try {
    // First, check if the recipe exists and get the current data
    const existingRecipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, input.id))
      .execute();

    if (existingRecipe.length === 0) {
      throw new Error(`Recipe with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

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
    
    if (input.categories !== undefined) {
      updateData.categories = input.categories;
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
    
    if (input.difficulty !== undefined) {
      updateData.difficulty = input.difficulty;
    }

    // Update the recipe
    const result = await db.update(recipesTable)
      .set(updateData)
      .where(eq(recipesTable.id, input.id))
      .returning()
      .execute();

    // Cast JSON fields to proper types
    const updatedRecipe = result[0];
    return {
      ...updatedRecipe,
      ingredients: updatedRecipe.ingredients as string[],
      instructions: updatedRecipe.instructions as string[],
      categories: updatedRecipe.categories as Array<'breakfast' | 'lunch' | 'dinner' | 'appetizer' | 'dessert' | 'snack' | 'beverage' | 'salad' | 'soup' | 'main_course' | 'side_dish' | 'vegetarian' | 'vegan' | 'gluten_free' | 'low_carb' | 'keto' | 'healthy' | 'comfort_food' | 'international'>
    };
  } catch (error) {
    console.error('Recipe update failed:', error);
    throw error;
  }
};
