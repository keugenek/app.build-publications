import { type SearchRecipesInput, type Recipe } from '../schema';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { sql } from 'drizzle-orm';

/**
 * Searches recipes by name or ingredients.
 * If the query string is empty or only whitespace, all recipes are returned.
 */
export async function searchRecipes(input: SearchRecipesInput): Promise<Recipe[]> {
  const rawQuery = input.query?.trim();
  // Return all when no query provided
  if (!rawQuery) {
    return await db.select().from(recipesTable).execute();
  }

  const pattern = `%${rawQuery}%`;
  // Use ILIKE for case‑insensitive matching on name or ingredients array (converted to text)
  const rows = await db
    .select()
    .from(recipesTable)
    .where(
      sql`${recipesTable.name} ILIKE ${pattern} OR ${recipesTable.ingredients}::text ILIKE ${pattern}`
    )
    .execute();

  return rows;
}
