import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type CreateRecipeInput, type Recipe } from '../schema';

export const createRecipe = async (input: CreateRecipeInput): Promise<Recipe> => {
  try {
    // Insert recipe record
    const result = await db.insert(recipesTable)
      .values({
        title: input.title,
        description: input.description,
        ingredients: input.ingredients, // PostgreSQL array column - no conversion needed
        instructions: input.instructions,
        prep_time_minutes: input.prep_time_minutes, // Integer column - no conversion needed
        cook_time_minutes: input.cook_time_minutes, // Integer column - no conversion needed
        servings: input.servings // Integer column - no conversion needed
      })
      .returning()
      .execute();

    // Return the created recipe (no numeric conversions needed for this table)
    return result[0];
  } catch (error) {
    console.error('Recipe creation failed:', error);
    throw error;
  }
};
