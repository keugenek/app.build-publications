import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type CreateRecipeInput, type Recipe } from '../schema';

export const createRecipe = async (input: CreateRecipeInput): Promise<Recipe> => {
  try {
    // Insert recipe record
    const result = await db.insert(recipesTable)
      .values({
        name: input.name,
        description: input.description || null,
        ingredients: input.ingredients,
        instructions: input.instructions || null,
        prep_time_minutes: input.prep_time_minutes || null,
        cook_time_minutes: input.cook_time_minutes || null,
        servings: input.servings || null
      })
      .returning()
      .execute();

    // Return the created recipe
    const recipe = result[0];
    return {
      ...recipe,
      // Ensure arrays are properly handled
      ingredients: recipe.ingredients || []
    };
  } catch (error) {
    console.error('Recipe creation failed:', error);
    throw error;
  }
};
