import { type Recipe } from '../schema';
import { type RecipeIdInput } from '../schema';

/**
 * Placeholder handler for fetching a single recipe by its ID.
 * In a real implementation this would query the database for the given ID.
 */
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function getRecipeById(input: RecipeIdInput): Promise<Recipe | null> {
  try {
    const results = await db
      .select()
      .from(recipesTable)
      .where(eq(recipesTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }
    // The DB returns the correct shape matching our Recipe type
    const r = results[0];
    // Cast JSONB fields to correct types
    return {
      ...r,
      ingredients: r.ingredients as unknown as string[],
      categories: r.categories as unknown as string[]
    };
  } catch (error) {
    console.error('Failed to fetch recipe by id:', error);
    throw error;
  }
}
