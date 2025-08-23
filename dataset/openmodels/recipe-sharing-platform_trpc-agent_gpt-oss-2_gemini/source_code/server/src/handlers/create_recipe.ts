import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type CreateRecipeInput, type Recipe } from '../schema';

/**
 * Inserts a new recipe into the database and returns the created record.
 * All fields are passed through directly; JSONB arrays are stored as provided.
 * The `created_at` column is a timestamp and will be returned as a Date object by Drizzle.
 */
export const createRecipe = async (input: CreateRecipeInput): Promise<Recipe> => {
  try {
    const result = await db
      .insert(recipesTable)
      .values({
        title: input.title,
        description: input.description ?? null,
        ingredients: input.ingredients,
        instructions: input.instructions,
        categories: input.categories,
        image_url: input.image_url ?? null,
      })
      .returning()
      .execute();

    // Drizzle returns an array of inserted rows; we expect one row.
    const raw = result[0];
    // Cast the raw DB row to the Recipe type expected by the schema.
    return raw as unknown as Recipe;
  } catch (error) {
    console.error('Failed to create recipe:', error);
    throw error;
  }
};
