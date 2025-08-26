import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe, type SearchRecipesInput } from '../schema';

/**
 * Search recipes based on optional title, categories, and ingredient filters.
 * This implementation fetches all recipes from the database and applies the
 * filters in JavaScript. While not the most efficient for large datasets,
 * it keeps the example simple and avoids complex Postgres JSONB queries.
 */
export async function searchRecipes(input: SearchRecipesInput): Promise<Recipe[]> {
  // Fetch all recipes from the DB
  const rows = await db.select().from(recipesTable).execute();

  // Apply filters if provided
  let results = rows as unknown as Recipe[]; // ensure type compatibility

  if (input.title) {
    const lowered = input.title.toLowerCase();
    results = results.filter(r => r.title.toLowerCase().includes(lowered));
  }

  if (input.categories && input.categories.length > 0) {
    // Return recipes that contain at least one of the requested categories
    results = results.filter(r =>
      r.categories.some(cat => input.categories!.includes(cat))
    );
  }

  if (input.ingredient) {
    const loweredIng = input.ingredient.toLowerCase();
    results = results.filter(r =>
      r.ingredients.some(ing => ing.toLowerCase().includes(loweredIng))
    );
  }

  // Ensure created_at is a Date instance (drizzle returns Date for timestamp)
  return results.map(r => ({
    ...r,
    created_at: r.created_at instanceof Date ? r.created_at : new Date(r.created_at as any),
  }));
}
