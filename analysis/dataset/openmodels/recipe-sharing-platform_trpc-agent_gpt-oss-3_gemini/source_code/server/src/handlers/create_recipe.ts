import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type CreateRecipeInput, type Recipe } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Creates a new recipe in the database and returns the created record.
 * This handler expects a parsed CreateRecipeInput (categories may be undefined).
 */
export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  try {
    const result = await db
      .insert(recipesTable)
      .values({
        name: input.name,
        ingredients: input.ingredients,
        instructions: input.instructions,
        // Store null when categories are omitted (column is nullable)
        categories: input.categories ?? null
      })
      .returning()
      .execute();

    // The insert returns an array with a single record
    const recipe = result[0];
    // The returned record already has correct types (id: number, created_at: Date)
    return recipe as Recipe;
  } catch (error) {
    console.error('Failed to create recipe:', error);
    throw error;
  }
}
