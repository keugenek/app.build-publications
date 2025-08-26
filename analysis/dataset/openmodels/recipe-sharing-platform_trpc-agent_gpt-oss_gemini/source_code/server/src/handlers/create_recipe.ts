import { type CreateRecipeInput, type Recipe } from '../schema';
import { db } from '../db';
import { recipesTable } from '../db/schema';

/**
 * Placeholder handler for creating a new recipe.
 * In a real implementation this would insert the recipe into the database
 * and return the created record.
 */
export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  try {
    // Insert recipe into DB
    const result = await db.insert(recipesTable)
      .values({
        title: input.title,
        ingredients: input.ingredients,
        instructions: input.instructions,
        categories: input.categories,
      })
      .returning()
      .execute();

    // result is array with inserted row
    const recipe = result[0];
    return recipe as Recipe;
  } catch (error) {
    console.error('Failed to create recipe:', error);
    throw error;
  }


}
